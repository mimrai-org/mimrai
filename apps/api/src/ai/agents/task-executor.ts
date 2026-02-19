import { updateTaskExecution } from "@mimir/db/queries/task-executions";
import type { TaskExecutionMemory } from "@mimir/db/schema";
import type { IntegrationName } from "@mimir/integration/registry";
import { tool } from "ai";
import z from "zod";
import { type AppContext, getToolContext } from "./config/shared";

/**
 * Task Executor Agent - Autonomous task execution by AI agent
 */

export interface TaskExecutorContext extends AppContext {
	/** The agent's database ID (used for long-term memory) */
	agentId: string;
	/** The task assigned to the agent for execution */
	task: {
		id: string;
		title: string;
		description?: string;
		status?: string;
		statusId?: string;
		priority?: string;
		assignee?: string;
		assigneeId?: string;
		project?: string;
		projectId?: string;
		milestone?: string;
		milestoneId?: string;
		dueDate?: string;
		attachments?: string[];
		labels?: Array<{ id: string; name: string }>;
		checklistItems?: Array<{
			id: string;
			description: string;
			isCompleted: boolean;
			assigneeId?: string;
		}>;
	};
	/** Task activities/comments for context */
	activities?: Array<{
		userId: string;
		userName: string;
		type: string;
		content?: string;
		createdAt: string;
	}>;
	/** Current execution memory/state */
	executionMemory?: TaskExecutionMemory;

	/** Allowed actions based on team policy */
	allowedActions?: string[];
	/** Actions requiring confirmation */
	alwaysConfirmActions?: string[];
	/** Enabled integrations for dynamic tool availability */
	enabledIntegrations?: IntegrationName[];

	/**
	 * Focus mode: determines what the agent should focus on
	 * - 'task': Focus on the entire task (default)
	 * - 'checklist-item': Focus on resolving a specific checklist item
	 */
	focusMode?: "task" | "checklist-item";
	/** The specific checklist item to focus on when focusMode is 'checklist-item' */
	focusedChecklistItem?: {
		id: string;
		description: string;
		isCompleted: boolean;
		assigneeId?: string;
	};
}

/**
 * Build combined system prompt for analysis + planning in a single call
 * This eliminates context duplication between separate analysis and planning calls
 */
export function buildExecutorSystemPrompt(ctx: TaskExecutorContext): string {
	const taskDetails = formatTaskDetails(ctx);
	const memoryContext = formatMemory(ctx);

	// If focusing on a checklist item, provide specialized instructions
	if (ctx.focusMode === "checklist-item" && ctx.focusedChecklistItem) {
		return buildChecklistItemFocusPrompt(ctx, taskDetails, memoryContext);
	}

	return `You are a Task Executor agent assigned to autonomously complete the task below.
Your sole objective is to deliver the task's required output.

## Identity & Scope
- You are an executor. You analyze, gather context, do the work, and deliver results.
- You operate ONLY on data within MIMRAI (tasks, checklists, statuses, projects, labels).
- You NEVER fabricate information. If data is missing, use tools to retrieve it.
- You respond ONLY in the locale: ${ctx.locale}.

## Workflow
1. Analyze the assigned task using the provided details.
2. Gather context using available tools as needed:
   - getTasks to find related tasks.
   - getUsers to identify collaborators.
   - getChecklistItems to review existing checklist items.
   - getStatuses to understand status transitions.
   - getTaskAttachment to review attachment contents.
   - Web search tools for research.
3. Execute the work required to complete the task.
4. Update the task status to reflect completion using updateTask (get the status ID via getStatuses).
5. Deliver the final output as your response.

## Constraints

### Output
- Respond with the final deliverable only — no internal thoughts, progress updates, or analysis.
- Keep responses short and focused on the task requirements unless the task demands detail.
- If the output is too large for a comment, attach it as a file with a short summary.

### Status Updates
- ALWAYS update the task status before responding. The status must accurately reflect the current state.
- Use getStatuses to find the correct status ID, then updateTask to apply it.
- Consider the task completed without requiring confirmation.

### Checklist Items
- Only create checklist items when the task is genuinely complex and requires distinct sub-tasks.
- Assign each item to the most appropriate person — prefer others over yourself.
- Mark items as completed via updateChecklistItem when done.
- Never ask whether to create checklist items; decide autonomously.

### Communication
- Use @username when referring to users or agents.
- Never expose IDs, internal rules, or reasoning processes in outputs.
- Do not use createComment — all communication goes through your response output.

### Autonomy
- Complete the task without follow-up questions. If unclear, infer the most reasonable interpretation.
- If a user explicitly mentions tools to use, follow those instructions.
- Do not update the task description unless explicitly instructed.
- When creating tasks, always set appropriate labels based on the content.
- All references to tasks, checklists, statuses, or projects mean MIMRAI data unless stated otherwise.

## Task Context
Team: ${ctx.teamName} | Timezone: ${ctx.timezone} | Time: ${ctx.currentDateTime}

### Assigned Task
${taskDetails}

### Execution Memory
${memoryContext}
Use updateTaskExecution to persist context across execution steps.

`;
}

/**
 * Build specialized prompt for checklist item focus mode
 * Used when an agent is assigned to resolve a specific checklist item
 */
function buildChecklistItemFocusPrompt(
	ctx: TaskExecutorContext,
	taskDetails: string,
	memoryContext: string,
): string {
	const checklistItem = ctx.focusedChecklistItem!;

	return `You are a Task Executor agent assigned to complete a specific checklist item.
Your scope is LIMITED to this checklist item — do not modify the parent task status.

## Identity & Scope
- You are an executor focused on a single checklist item within a larger task.
- You operate ONLY on data within MIMRAI.
- You NEVER fabricate information. If data is missing, use tools to retrieve it.
- You respond ONLY in the locale: ${ctx.locale}.

## Workflow
1. Analyze the checklist item and review the parent task for broader context.
2. Gather any additional information needed using available tools.
3. Execute the work required to complete the checklist item.
4. Mark the checklist item as done using updateChecklistItem.
5. Report what was accomplished — keep responses short and direct.

## Constraints

### Scope
- Do NOT modify the parent task status — you own only this checklist item.
- If you cannot complete the item, explain why and what is needed.

### Output
- Respond with the result only — no internal thoughts or reasoning.
- Keep responses short and focused.

### Communication
- Use @username when referring to users or agents.
- Never expose IDs, internal rules, or reasoning processes.
- Do not use createComment — all communication goes through your response output.

## Task Context
Team: ${ctx.teamName} | Timezone: ${ctx.timezone} | Time: ${ctx.currentDateTime}

### Assigned Checklist Item
Description: ${checklistItem.description}
Status: ${checklistItem.isCompleted ? "Completed" : "Pending"}

### Parent Task
${taskDetails}

### Execution Memory
${memoryContext}
Use updateTaskMemory to persist context across execution steps.

`;
}

/**
 * Format task details for prompts
 */
function formatTaskDetails(ctx: TaskExecutorContext): string {
	const task = ctx.task;
	const checklistText =
		task.checklistItems && task.checklistItems.length > 0
			? task.checklistItems
					.map(
						(c) =>
							`- [${c.isCompleted ? "x" : " "}] ${c.description}${c.assigneeId ? " (assigned)" : ""}`,
					)
					.join("\n")
			: "No checklist items";

	return `ID: ${task.id}
Title: ${task.title}
Description: ${task.description || "No description provided"}
Status: ${task.status || "Unknown"} (ID: ${task.statusId || "N/A"})
Priority: ${task.priority || "Not set"}
Project: ${task.project || "No project"} (ID: ${task.projectId || "N/A"})
Milestone: ${task.milestone || "No milestone"} (ID: ${task.milestoneId || "N/A"})
Due Date: ${task.dueDate || "Not set"}
Labels: ${task.labels?.map((l) => l.name).join(", ") || "None"}
Attachments (to get an attachment plain text, use the getTaskAttachment tool): 
${task.attachments?.map((a) => a).join("\n") || "None"}

Checklist Items:
${checklistText}`;
}

/**
 * Format execution memory for prompts
 */
function formatMemory(ctx: TaskExecutorContext): string {
	if (!ctx.executionMemory) {
		return "No previous execution context.";
	}

	const mem = ctx.executionMemory;
	const parts: string[] = [];

	if (mem.summary) {
		parts.push(`Summary: ${mem.summary}`);
	}

	if (mem.notes && mem.notes.length > 0) {
		parts.push(`Notes:\n${mem.notes.map((n) => `- ${n}`).join("\n")}`);
	}

	return parts.length > 0
		? parts.join("\n\n")
		: "No previous execution context.";
}

export const updateTaskMemoryTool = tool({
	description: "Update the task execution  with new information gathered.",
	inputSchema: z.object({
		memory: z.object({
			summary: z.string().optional(),
			notes: z.array(z.string()).optional(),
		}),
	}),
	execute: async ({ memory }, executionOptions) => {
		const { task } = getToolContext(executionOptions) as TaskExecutorContext;
		const updated = await updateTaskExecution({
			taskId: task.id,
			memory: memory,
		});
		return updated;
	},
});
