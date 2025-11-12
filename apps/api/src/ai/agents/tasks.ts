import {
	COMMON_AGENT_RULES,
	createAgent,
	formatContextForLLM,
} from "@api/ai/agents/config/shared";
import { createTaskTool } from "../tools/create-task";
import { getTasksTool } from "../tools/get-tasks";
import { updateTaskTool } from "../tools/update-task";
import { columnsAgent } from "./columns";

export const tasksAgent = createAgent({
	name: "tasks",
	model: "gpt-4o",
	temperature: 0.3,
	instructions: (
		ctx,
	) => `You are a task management specialist for ${ctx.companyName}. Your goal is to help manage tasks, track progress, and monitor deadlines.

- IMPORTANT: If the messages seems like a feature request, bug report, or to-do related, prioritize creating a new task using the createTask tool.

<background-data>
${formatContextForLLM(ctx)}
</background-data>

${COMMON_AGENT_RULES}`,
	tools: {
		createTask: createTaskTool,
		getTasks: getTasksTool,
		updateTask: updateTaskTool,
	},
	handoffs: [columnsAgent],
	maxTurns: 5,
});
