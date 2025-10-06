import { openai } from "@ai-sdk/openai";
import type { InferUITools } from "ai";
import { getContext } from "./context";
import { createTaskTool } from "./tools/create-task";
import { getColumnsTool } from "./tools/get-columns";
import { getTasksTool } from "./tools/get-tasks";
import { getUsersTool } from "./tools/get-users";
import { updateTaskTool } from "./tools/update-task";

// Tool registry function - this creates the actual tool implementations
export const createToolRegistry = () => {
	const context = getContext();

	return {
		createTask: createTaskTool,
		getColumns: getColumnsTool,
		getTasks: getTasksTool,
		updateTask: updateTaskTool,
		getUsers: getUsersTool,
		web_search: openai.tools.webSearch({
			searchContextSize: "medium",
			userLocation: {
				type: "approximate",
				country: context.user.country ?? undefined,
				city: context.user.city ?? undefined,
				region: context.user.region ?? undefined,
			},
		}),
	};
};

// Infer the UI tools type from the registry
export type UITools = InferUITools<ReturnType<typeof createToolRegistry>>;
