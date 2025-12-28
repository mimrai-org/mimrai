import { openai } from "@ai-sdk/openai";
import {
	COMMON_AGENT_RULES,
	createAgent,
	formatContextForLLM,
} from "@api/ai/agents/config/shared";
import { task } from "@trigger.dev/sdk";
import { createChecklistItemTool } from "../tools/create-checklist-item";
import { createLabelTool } from "../tools/create-label";
import { createTaskTool } from "../tools/create-task";
import { createTaskPullRequestTool } from "../tools/create-task-pull-request";
import { getChecklistItemsTool } from "../tools/get-checklist-item";
import { getLabelsTool } from "../tools/get-labels";
import { getStatusesTool } from "../tools/get-statuses";
import { getTasksTool } from "../tools/get-tasks";
import { taskAutocompleteTool } from "../tools/task-autocomplete";
import { updateChecklistItemTool } from "../tools/update-checklist-item";
import { updateTaskTool } from "../tools/update-task";

export const tasksAgent = createAgent({
	name: "tasks",
	model: openai("gpt-4o-mini"),
	temperature: 0,
	instructions: (
		ctx,
	) => `You are a task management specialist for ${ctx.teamName}. You execute task operations using the task tools.

<agent-specific-rules>
- When answering questions about tasks, always provide useful context and summaries based on the data available
- If the tasks fit in the current work cycle, create it using the to_do column unless specified otherwise
- When creating checklist items, ensure they are specific, actionable, and relevant to the associated task

- If the user asks about their pending tasks, only consider tasks assigned to them wich status is not [done, backlog]
- Preserve naming consistency and use clear verbs.
- Some tools require UUIDs as inputs. Ensure to provide valid UUIDs when using those tools.

- When creating or updating tasks, ALWAYS use the taskAutocomplete tool before to fill in missing details like assignee, status, and labels based on the task title and description.
- When creating or updating tasks, ensure to set appropriate due dates based on project timelines
- When creating tasks, keep the title concise yet descriptive to clearly convey the task's purpose
</agent-specific-rules>

<background-data>
${formatContextForLLM(ctx)}
</background-data>

${COMMON_AGENT_RULES}`,
	tools: {
		taskAutocomplete: taskAutocompleteTool,
		createTask: createTaskTool,
		getTasks: getTasksTool,
		updateTask: updateTaskTool,
		createTaskPullRequest: createTaskPullRequestTool,
		createChecklistItem: createChecklistItemTool,
		getChecklistItems: getChecklistItemsTool,
		updateChecklistItem: updateChecklistItemTool,
		getColumns: getStatusesTool,
		getLabels: getLabelsTool,
		createLabel: createLabelTool,
	},
	handoffs: [],
	maxTurns: 5,
});
