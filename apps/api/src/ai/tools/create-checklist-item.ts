import { createChecklistItem } from "@mimir/db/queries/checklists";
import { tool } from "ai";
import z from "zod";
import { getToolContext } from "../agents/config/shared";

export const createChecklistItemToolSchema = z.object({
	taskId: z.string().describe("Task ID"),
	description: z.string().optional().describe("Task description"),
	assigneeId: z.string().optional().describe("Assignee User ID"),
	attachments: z
		.array(z.string())
		.optional()
		.describe("List of attachment URLs"),
});

export const createChecklistItemTool = tool({
	description: "Create a new checklist item for a specific task.",
	inputSchema: createChecklistItemToolSchema,
	execute: async function* (input, executionOptions) {
		const { userId, teamId } = getToolContext(executionOptions);

		const data = await createChecklistItem({
			description: input.description,
			assigneeId: input.assigneeId,
			teamId: teamId,
			userId,
			taskId: input.taskId,
			attachments: input.attachments,
		});

		yield {
			text: "Subtask created successfully.",
			data,
		};
	},
});
