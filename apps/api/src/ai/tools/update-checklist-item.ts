import { updateChecklistItem } from "@mimir/db/queries/checklists";
import { tool } from "ai";
import z from "zod";
import type { AppContext } from "../agents/config/shared";

export const updateChecklistItemToolSchema = z.object({
	id: z.string().describe("Checklist Item ID"),
	description: z.string().optional().describe("Checklist Item description"),
	isCompleted: z
		.boolean()
		.optional()
		.describe("Whether the checklist item is completed"),
	assigneeId: z.string().optional().describe("Assignee User ID"),
});

export const updateChecklistItemTool = tool({
	description: "Update a specific checklist item",
	inputSchema: updateChecklistItemToolSchema,
	execute: async function* (input, executionOptions) {
		const { userId, teamId } =
			executionOptions.experimental_context as AppContext;

		const data = await updateChecklistItem({
			id: input.id,
			description: input.description,
			isCompleted: input.isCompleted,
			assigneeId: input.assigneeId,
			teamId: teamId,
		});

		yield {
			text: "Checklist item updated successfully.",
			data,
		};
	},
});
