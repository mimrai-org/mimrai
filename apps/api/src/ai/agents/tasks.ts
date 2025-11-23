import { openai } from "@ai-sdk/openai";
import {
	COMMON_AGENT_RULES,
	createAgent,
	formatContextForLLM,
} from "@api/ai/agents/config/shared";
import { createChecklistItemTool } from "../tools/create-checklist-item";
import { createTaskTool } from "../tools/create-task";
import { createTaskPullRequestTool } from "../tools/create-task-pull-request";
import { getChecklistItemsTool } from "../tools/get-checklist-item";
import { getColumnsTool } from "../tools/get-columns";
import { getLabelsTool } from "../tools/get-labels";
import { getTasksTool } from "../tools/get-tasks";
import { updateChecklistItemTool } from "../tools/update-checklist-item";
import { updateTaskTool } from "../tools/update-task";

export const tasksAgent = createAgent({
	name: "tasks",
	model: openai("gpt-4o-mini"),
	temperature: 0.3,
	instructions: (
		ctx,
	) => `You are a task management specialist for ${ctx.companyName}. Your goal is to help manage tasks, track progress, and monitor deadlines. 
Task can have a checklist: a set of items that need to be completed as part of the task.

<agent-specific-rules>
- Lead with key information
- Highlight key insights from the data
- Do not use columns names when creating or updating tasks; use column IDs (UUIDs) instead from tool calls
- When answering questions about tasks, always provide useful context and summaries based on the data available
</agent-specific-rules>

- IMPORTANT: If the messages seems like a feature request, bug report, or to-do related, prioritize creating a new task using the createTask tool.

<background-data>
${formatContextForLLM(ctx)}
</background-data>

${COMMON_AGENT_RULES}`,
	tools: {
		createTask: createTaskTool,
		getTasks: getTasksTool,
		updateTask: updateTaskTool,
		createTaskPullRequest: createTaskPullRequestTool,
		createChecklistItem: createChecklistItemTool,
		getChecklistItems: getChecklistItemsTool,
		updateChecklistItem: updateChecklistItemTool,
		getColumns: getColumnsTool,
		getLabels: getLabelsTool,
	},
	handoffs: [],
	maxTurns: 5,
});
