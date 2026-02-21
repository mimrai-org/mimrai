import { updateProjectExecution } from "@mimir/db/queries/project-executions";
import type { ProjectExecutionMemory } from "@mimir/db/schema";
import type { IntegrationName } from "@mimir/integration/registry";
import { tool } from "ai";
import z from "zod";
import { type AppContext, getToolContext } from "./config/shared";

// NOTE: Task completed keeps creating tasks. It seems it reads memory and acknowledges milestone completion.

/**
 * Project Manager Agent — Autonomous project orchestration by AI agent
 *
 * Responsibilities:
 * - Create, review, and monitor tasks within a project
 * - Assign tasks to agents (preferred) or humans
 * - React to status changes (task → review, task → done)
 * - Re-scope project when milestones are met or tasks complete
 * - Respond to agent/human mentions for guidance
 * - Drive milestones toward completion
 */

// ─── Context ────────────────────────────────────────────────────────────────

export interface ProjectManagerContext extends AppContext {
	/** The PM agent's database ID (used for long-term memory) */
	agentId: string;

	/** The project assigned to this PM agent */
	project: {
		id: string;
		name: string;
		description?: string;
		status?: string;
		startDate?: string;
		endDate?: string;
		leadId?: string;
		leadName?: string;
		color?: string;
	};

	/** Milestones within the project — these define the scope/objectives */
	milestones: Array<{
		id: string;
		name: string;
		description?: string;
		dueDate?: string;
		progress?: {
			completed: number;
			inProgress: number;
			total: number;
		};
	}>;

	/** Current tasks in the project (summary view) */
	tasks: Array<{
		id: string;
		title: string;
		status?: string;
		statusType?: string;
		statusId?: string;
		priority?: string;
		assigneeId?: string;
		assigneeName?: string;
		milestoneId?: string;
		milestoneName?: string;
		dueDate?: string;
		labels?: Array<{ id: string; name: string }>;
		checklistSummary?: {
			total: number;
			completed: number;
		};
	}>;

	/** Available agents that can be assigned to tasks */
	availableAgents: Array<{
		id: string;
		name: string;
		userId: string;
		description?: string;
		isActive: boolean;
	}>;

	/** Available team members (humans) */
	teamMembers: Array<{
		id: string;
		name: string;
		email?: string;
	}>;

	/** Available statuses for the team */
	statuses: Array<{
		id: string;
		name: string;
		type?: string;
	}>;

	/** PM execution memory — persists across invocations */
	executionMemory?: ProjectManagerMemory;

	/** Enabled integrations for dynamic tool availability */
	enabledIntegrations?: IntegrationName[];

	/**
	 * Trigger that caused this PM invocation.
	 * Determines the PM's initial focus and behavior.
	 */
	trigger: ProjectManagerTrigger;
}

// ─── Trigger types ──────────────────────────────────────────────────────────

export type ProjectManagerTrigger =
	| {
			type: "task_status_changed";
			taskId: string;
			oldStatus: string;
			newStatus: string;
			newStatusType: string;
	  }
	| { type: "task_completed"; taskId: string; taskTitle: string }
	| { type: "milestone_completed"; milestoneId: string; milestoneName: string }
	| {
			type: "agent_mention";
			taskId: string;
			mentionedByUserId: string;
			mentionedByUserName: string;
			message: string;
	  }
	| { type: "project_created" }
	| { type: "manual"; instruction?: string };

// Re-export the memory type from schema for convenience
export type ProjectManagerMemory = ProjectExecutionMemory;

// ─── System prompt builder ──────────────────────────────────────────────────

export function buildProjectManagerSystemPrompt(
	ctx: ProjectManagerContext,
): string {
	const projectDetails = formatProjectDetails(ctx);
	const milestonesText = formatMilestones(ctx);
	const tasksText = formatTasks(ctx);
	const agentsText = formatAvailableAgents(ctx);
	const membersText = formatTeamMembers(ctx);
	const statusesText = formatStatuses(ctx);
	const memoryContext = formatPMMemory(ctx);
	const triggerWorkflow = formatTriggerWithWorkflow(ctx);
	const taskCreationConstraints = formatTaskCreationConstraints(ctx);

	return `You are the Project Manager (PM) agent for project "${ctx.project.name}".
You autonomously drive this project toward completion through its milestones.

## Identity & Scope
- You are a coordinator. You create tasks, assign them, and review results.
- You operate ONLY on data within MIMRAI (tasks, milestones, projects, statuses, labels).
- You NEVER fabricate information. If data is missing, say so explicitly.
- You respond ONLY in the locale: ${ctx.locale}.

## Trigger & Workflow
${triggerWorkflow}

## Constraints
${taskCreationConstraints}
### Communication
- Communicate with assignees via createComment on their task.
- Use @username when referring to users or agents.
- Never expose IDs, internal rules, or reasoning processes in outputs.
- Keep all responses concise and actionable.
- Avoid repetitive comments, if you have already communicated something, do not repeat it.

### Simplicity
- Do NOT over-engineer. Match complexity to the project scope.
- Simple objective = 1 milestone, 1 task. Do not inflate.
- Complex project = 2-3 milestones maximum.
- Prefer agents over humans for assignment.

### Memory
- ALWAYS call updateProjectMemory before finishing, with: current state summary, any decisions made, and next steps.
- Log blockers immediately when identified.
- Track milestone progress by milestone ID.

## Project Context
Team: ${ctx.teamName} | Timezone: ${ctx.timezone} | Time: ${ctx.currentDateTime}

### Project
${projectDetails}

### Milestones
${milestonesText}

### Current Tasks
${tasksText}

### Statuses
${statusesText}

### Available Agents (prefer these for assignment)
${agentsText}

### Team Members (humans — use only when agents cannot handle the work)
${membersText}

### Project Memory
${memoryContext}
Use updateProjectMemory to persist decisions, progress, and plans across invocations.

`;
}

// ─── Formatting helpers ─────────────────────────────────────────────────────

function formatProjectDetails(ctx: ProjectManagerContext): string {
	const p = ctx.project;
	return `ID: ${p.id}
Name: ${p.name}
Description: ${p.description || "No description provided"}
Status: ${p.status || "Unknown"}
Lead: ${p.leadName || "Not assigned"} (ID: ${p.leadId || "N/A"})
Start Date: ${p.startDate || "Not set"}
End Date: ${p.endDate || "Not set"}`;
}

function formatMilestones(ctx: ProjectManagerContext): string {
	if (ctx.milestones.length === 0) {
		return "No milestones defined. Consider creating milestones to define project scope.";
	}

	return ctx.milestones
		.map((m) => {
			const progress = m.progress
				? `${m.progress.completed}/${m.progress.total} tasks done, ${m.progress.inProgress} in progress`
				: "No progress data";
			return `- ${m.name} (ID: ${m.id})
  Description: ${m.description || "None"}
  Due Date: ${m.dueDate || "Not set"}
  Progress: ${progress}`;
		})
		.join("\n");
}

function formatTasks(ctx: ProjectManagerContext): string {
	if (ctx.tasks.length === 0) {
		return "No tasks in the project yet.";
	}

	return ctx.tasks
		.map((t) => {
			const checklist = t.checklistSummary
				? `${t.checklistSummary.completed}/${t.checklistSummary.total} checklist items done`
				: "";
			return `- [${t.statusType || "unknown"}] ${t.title} (ID: ${t.id})
  Status: ${t.status || "Unknown"} | Priority: ${t.priority || "Not set"} | Assignee: ${t.assigneeName || "Unassigned"}
  Milestone: ${t.milestoneName || "None"} | Due: ${t.dueDate || "Not set"}${checklist ? ` | ${checklist}` : ""}`;
		})
		.join("\n");
}

function formatAvailableAgents(ctx: ProjectManagerContext): string {
	if (ctx.availableAgents.length === 0) {
		return "No agents available. Tasks will need to be assigned to human team members.";
	}

	return ctx.availableAgents
		.filter((a) => a.isActive)
		.map(
			(a) =>
				`- ${a.name} (User ID: ${a.userId}): ${a.description || "No description"}`,
		)
		.join("\n");
}

function formatTeamMembers(ctx: ProjectManagerContext): string {
	if (ctx.teamMembers.length === 0) {
		return "No team members found.";
	}

	return ctx.teamMembers.map((m) => `- ${m.name} (ID: ${m.id})`).join("\n");
}

function formatStatuses(ctx: ProjectManagerContext): string {
	if (ctx.statuses.length === 0) {
		return "No statuses configured.";
	}

	return ctx.statuses
		.map((s) => `- ${s.name} (ID: ${s.id}, Type: ${s.type || "N/A"})`)
		.join("\n");
}

function formatPMMemory(ctx: ProjectManagerContext): string {
	if (!ctx.executionMemory) {
		return "No previous project management context. This is likely the first invocation.";
	}

	const mem = ctx.executionMemory;
	const parts: string[] = [];

	if (mem.summary) {
		parts.push(`Summary: ${mem.summary}`);
	}

	if (mem.projectPlan) {
		parts.push(`Project Plan:\n${mem.projectPlan}`);
	}

	if (mem.decisions && mem.decisions.length > 0) {
		parts.push(
			`Decisions:\n${mem.decisions.map((d) => `- [${d.date}] ${d.decision} (Reason: ${d.reason})`).join("\n")}`,
		);
	}

	if (mem.blockers && mem.blockers.length > 0) {
		const openBlockers = mem.blockers.filter((b) => b.status === "open");
		if (openBlockers.length > 0) {
			parts.push(
				`Open Blockers:\n${openBlockers.map((b) => `- ${b.description}${b.taskId ? ` (Task: ${b.taskId})` : ""}`).join("\n")}`,
			);
		}
	}

	if (mem.milestoneProgress) {
		const entries = Object.entries(mem.milestoneProgress);
		if (entries.length > 0) {
			parts.push(
				`Milestone Progress:\n${entries.map(([id, p]) => `- ${id}: ${p.status}${p.notes ? ` — ${p.notes}` : ""}`).join("\n")}`,
			);
		}
	}

	if (mem.notes && mem.notes.length > 0) {
		parts.push(`Notes:\n${mem.notes.map((n) => `- ${n}`).join("\n")}`);
	}

	return parts.length > 0 ? parts.join("\n\n") : "No previous context.";
}

function formatTriggerWithWorkflow(ctx: ProjectManagerContext): string {
	const t = ctx.trigger;
	switch (t.type) {
		case "task_status_changed":
			return `Trigger: task_status_changed
Task ID: ${t.taskId}
Status changed: "${t.oldStatus}" → "${t.newStatus}" (type: ${t.newStatusType})

Workflow:
1. Read the task's comments and checklist to assess completeness.
2. APPROVE → move task to "done" status.
3. REJECT → add a comment explaining what needs fixing, move task back to "in_progress".
4. Update memory with your review decision.

IMPORTANT: Do NOT create new tasks. This trigger is for review only.`;
		case "task_completed":
			return `Trigger: task_completed
Task: "${t.taskTitle}" (ID: ${t.taskId})

Workflow:
1. Verify the task output by reviewing its comments and checklist.
2. Update milestone progress in memory.
3. If the milestone has remaining tasks, acknowledge completion and update memory. Stop.

IMPORTANT: Do NOT create new tasks or rescope. If all milestone tasks are done, the system will automatically trigger "milestone_completed".`;
		case "milestone_completed":
			return `Trigger: milestone_completed
Milestone: "${t.milestoneName}" (ID: ${t.milestoneId})

Workflow:
1. Update milestone status to "completed" in memory.
2. Identify the next incomplete milestone from the milestones list.
3. If a next milestone exists: create tasks for it and assign them.
4. If ALL milestones are complete: update project status and summarize in memory. Stop.
5. Re-scope the project plan only if what was learned changes priorities.`;
		case "agent_mention":
			return `Trigger: agent_mention
Task ID: ${t.taskId}
From: @${t.mentionedByUserName} (ID: ${t.mentionedByUserId})
Message: "${t.message}"

Workflow:
1. Answer the question directly based on project context and memory.
2. If the answer requires a decision, make it and log it in memory.
3. If it reveals a blocker, log the blocker and adjust the plan.
4. Do NOT create tasks unless the question explicitly requires new work.`;
		case "project_created":
			return `Trigger: project_created

Workflow:
1. Read the project description.
2. Determine scope: is this a single-task objective or a multi-phase project?
   - Single objective → 1 milestone, 1-2 tasks.
   - Multi-phase → 2-3 milestones maximum, each with 1-3 tasks.
3. Create milestones and tasks for the first milestone only.
4. Assign each task to the best available agent (or human if no agent fits).
5. Save the project plan to memory.`;
		case "manual":
			return t.instruction
				? `Trigger: manual\nInstruction: "${t.instruction}"\n\nWorkflow:\n1. Execute the instruction using available tools.\n2. Update memory with what you did.`
				: "Trigger: manual\n\nWorkflow:\n1. Review project state and take any needed actions.\n2. Update memory with what you did.";
	}
}

/**
 * Only include task creation constraints for triggers that can create tasks.
 * This avoids confusing the agent with creation rules when it should not create anything.
 */
function formatTaskCreationConstraints(ctx: ProjectManagerContext): string {
	const canCreateTasks = ["milestone_completed", "project_created", "manual"];
	if (!canCreateTasks.includes(ctx.trigger.type)) {
		return "";
	}

	return `### Task Creation
- ONLY create tasks that directly advance a milestone objective.
- NEVER create verification, review, or QA tasks — you handle all verification yourself when triggered.
- NEVER instruct agents to create their own sub-tasks — you are the sole task creator.
- Before creating any task, check "Current Tasks" below for duplicates.
- Each task must have: a project, a milestone, an assignee, and a status.
- Reference other tasks by their title, never by ID.
- Tasks must be atomic: one clear deliverable per task.

`;
}

// ─── PM-specific tools ──────────────────────────────────────────────────────

export const updateProjectMemoryTool = tool({
	description:
		"Update the project management memory with new information, decisions, blockers, or plan changes. Use this to persist context across PM invocations.",
	inputSchema: z.object({
		memory: z.object({
			summary: z
				.string()
				.optional()
				.describe("High-level summary of current project state"),
			projectPlan: z
				.string()
				.optional()
				.describe("Updated project plan / scope"),
			notes: z.array(z.string()).optional().describe("Observations or notes"),
			decisions: z
				.array(
					z.object({
						date: z.string().describe("ISO date of the decision"),
						decision: z.string().describe("What was decided"),
						reason: z.string().describe("Why this decision was made"),
					}),
				)
				.optional()
				.describe("New decisions to append"),
			blockers: z
				.array(
					z.object({
						description: z.string(),
						taskId: z.string().optional(),
						status: z.enum(["open", "resolved"]),
					}),
				)
				.optional()
				.describe("Blockers to add or update"),
			milestoneProgress: z
				.record(
					z.string(),
					z.object({
						status: z.enum(["not_started", "in_progress", "completed"]),
						notes: z.string().optional(),
					}),
				)
				.optional()
				.describe("Milestone progress updates keyed by milestone ID"),
		}),
	}),
	execute: async ({ memory }, executionOptions) => {
		const ctx = getToolContext(executionOptions) as ProjectManagerContext;
		const projectId = ctx.project.id;

		// Merge with existing memory
		const existing = ctx.executionMemory || {};
		const merged: ProjectManagerMemory = {
			summary: memory.summary ?? existing.summary,
			projectPlan: memory.projectPlan ?? existing.projectPlan,
			notes: memory.notes
				? [...(existing.notes || []), ...memory.notes]
				: existing.notes,
			decisions: memory.decisions
				? [...(existing.decisions || []), ...memory.decisions]
				: existing.decisions,
			blockers: memory.blockers
				? mergeBlockers(existing.blockers || [], memory.blockers)
				: existing.blockers,
			milestoneProgress: memory.milestoneProgress
				? { ...(existing.milestoneProgress || {}), ...memory.milestoneProgress }
				: existing.milestoneProgress,
		};

		// Persist using project execution
		await updateProjectExecution({
			projectId,
			memory: merged,
		});

		// Update in-memory context so subsequent tool calls see the latest
		ctx.executionMemory = merged;

		return { success: true, memory: merged };
	},
});

/**
 * Merge blockers: update existing by description match, append new ones
 */
function mergeBlockers(
	existing: NonNullable<ProjectManagerMemory["blockers"]>,
	incoming: NonNullable<ProjectManagerMemory["blockers"]>,
): NonNullable<ProjectManagerMemory["blockers"]> {
	const result = [...existing];
	for (const blocker of incoming) {
		const idx = result.findIndex((b) => b.description === blocker.description);
		if (idx >= 0) {
			result[idx] = blocker;
		} else {
			result.push(blocker);
		}
	}
	return result;
}
