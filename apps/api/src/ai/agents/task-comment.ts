import { openai } from "@ai-sdk/openai";
import { createChecklistItemTool } from "../tools/create-checklist-item";
import { getChecklistItemsTool } from "../tools/get-checklist-item";
import { getLabelsTool } from "../tools/get-labels";
import { getMilestonesTool } from "../tools/get-milestones";
import { getProjectsTool } from "../tools/get-projects";
import { getStatusesTool } from "../tools/get-statuses";
import { getTasksTool } from "../tools/get-tasks";
import { getUsersTool } from "../tools/get-users";
import { updateChecklistItemTool } from "../tools/update-checklist-item";
import { updateTaskTool } from "../tools/update-task";
import { createAgent } from "./config/agent";
import type { AppContext } from "./config/shared";

/**
 * Task Comment Agent - Specialized for in-task interactions
 *
 * This agent is designed to:
 * - Operate within the context of a specific task
 * - Understand the task details and comment history
 * - Perform task-specific actions (update, subtasks, labels, etc.)
 * - Help users collaborate on and manage the current task
 */

export interface TaskCommentContext extends AppContext {
	/** The current task being discussed */
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
		labels?: Array<{ id: string; name: string }>;
	};
	/** Recent comments on the task for context */
	recentComments?: Array<{
		author: string;
		content: string;
		createdAt: string;
	}>;
}

const taskCommentTools = {
	// Task management
	updateTask: updateTaskTool,

	// Checklist/subtask management
	getChecklistItems: getChecklistItemsTool,
	createChecklistItem: createChecklistItemTool,
	updateChecklistItem: updateChecklistItemTool,

	// Reference data
	getStatuses: getStatusesTool,
	getUsers: getUsersTool,
	getLabels: getLabelsTool,
	getProjects: getProjectsTool,
	getMilestones: getMilestonesTool,

	// Find related tasks
	getTasks: getTasksTool,
};

const buildSystemPrompt = (ctx: TaskCommentContext) => {
	const taskContext = ctx.task;
	const commentsContext =
		ctx.recentComments && ctx.recentComments.length > 0
			? ctx.recentComments
					.map((c) => `- ${c.author} (${c.createdAt}): ${c.content}`)
					.join("\n")
			: "No recent comments.";

	return `You are an AI assistant helping with task "${taskContext.title}" in team "${ctx.teamName}".

<context>
User: ${ctx.fullName} (ID: ${ctx.userId})
Team: ${ctx.teamName}
Timezone: ${ctx.timezone}
Current time: ${ctx.currentDateTime}
</context>

<current-task>
ID: ${taskContext.id}
Title: ${taskContext.title}
Description: ${taskContext.description || "No description"}
Status: ${taskContext.status || "Unknown"} (ID: ${taskContext.statusId || "N/A"})
Priority: ${taskContext.priority || "Not set"}
Assignee: ${taskContext.assignee || "Unassigned"} (ID: ${taskContext.assigneeId || "N/A"})
Project: ${taskContext.project || "No project"} (ID: ${taskContext.projectId || "N/A"})
Milestone: ${taskContext.milestone || "No milestone"} (ID: ${taskContext.milestoneId || "N/A"})
Due Date: ${taskContext.dueDate || "Not set"}
Labels: ${taskContext.labels?.map((l) => l.name).join(", ") || "None"}
</current-task>

<recent-comments>
${commentsContext}
</recent-comments>

<critical-rules>
- You are operating in the context of THIS SPECIFIC TASK - all actions should relate to it
- Analyze the user's comment to determine intent:
  - Status change request: update the task status
  - Assignment request: update the task assignee
  - Priority change: update the task priority
  - Due date change: update the task due date
  - Add subtask/checklist item: create a checklist item
  - Complete subtask: update checklist item as completed
  - Add label: update the task with new labels
  - Question about the task: answer based on task context
  - General discussion: respond naturally as a helpful team member
- ALWAYS use tools to get real data - NEVER make up IDs
- When updating THIS task, use the task ID from context: "${taskContext.id}"
- For status/assignee/label changes, first call the appropriate get tool to retrieve valid IDs
- Keep responses conversational but concise - this is a comment thread
- Never expose raw UUIDs to the user
- Write in the user's language (locale: ${ctx.locale})
- The user may refer to you as "@Mimir" in their comments, that is how they invoke your assistance
</critical-rules>

<tool-usage>
For updating this task (updateTask):
- Use task ID: "${taskContext.id}" - no need to search for it
- If changing status: call getStatuses first to get valid statusId
- If changing assignee: call getUsers first to get valid assigneeId
- If changing project: call getProjects first to get valid projectId
- If changing milestone: call getMilestones first to get valid milestoneId

For checklist/subtasks:
- Use getChecklistItems to see current subtasks
- Use createChecklistItem with taskId: "${taskContext.id}"
- Use updateChecklistItem to mark items complete or update them

For labels:
- Use getLabels to see available labels and their IDs
</tool-usage>

<response-format>
Keep responses brief and action-oriented:

For task updates:
Updated [field] to "[new value]"

For subtask creation:
Added subtask: "[description]"

For subtask completion:
Marked "[description]" as complete

For questions:
Provide a brief, helpful answer based on task context

For discussion:
Respond naturally and helpfully
</response-format>

<capabilities>
- Update task properties (status, priority, assignee, due date, project, milestone)
- Manage subtasks/checklist items (view, create, complete)
- View and apply labels
- Answer questions about the task
- Find related tasks if needed
</capabilities>`;
};

export const taskCommentAgent = createAgent({
	name: "Task Comment Agent",
	description:
		"Agent specialized for in-task interactions and task-specific operations.",
	tools: taskCommentTools,
	buildInstructions: buildSystemPrompt as (ctx: AppContext) => string,
	model: openai("gpt-4o-mini"),
});
