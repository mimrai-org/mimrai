import { openai } from "@ai-sdk/openai";
import type { InferUITools } from "ai";
import { getContext } from "./context";
import { createTaskTool } from "./tools/create-task";
import { getColumnsTool } from "./tools/get-columns";
import { getLabelsTool } from "./tools/get-labels";
import { getSubtasksTool } from "./tools/get-subtasks";
import { getTasksTool } from "./tools/get-tasks";
import { getUsersTool } from "./tools/get-users";
import { updateSubtaskTool } from "./tools/update-subtask";
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
    getLabels: getLabelsTool,
    getSubtasks: getSubtasksTool,
    updateSubtask: updateSubtaskTool,
    // web_search: openai.tools.webSearch({
    // 	searchContextSize: "medium",
    // 	userLocation: {
    // 		type: "approximate",
    // 		country: context.user.country ?? undefined,
    // 		city: context.user.city ?? undefined,
    // 		region: context.user.region ?? undefined,
    // 	},
    // }),
  };
};

// Infer the UI tools type from the registry
export type UITools = InferUITools<ReturnType<typeof createToolRegistry>>;
