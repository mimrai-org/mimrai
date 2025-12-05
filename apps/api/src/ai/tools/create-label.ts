import { createLabel } from "@db/queries/labels";
import { tool } from "ai";
import z from "zod";
import type { AppContext } from "../agents/config/shared";

export const createLabelToolSchema = z.object({
	name: z.string().min(1).describe("Name of the label"),
	color: z
		.string()
		.optional()
		.describe("Color of the label in HEX format without alpha"),
	description: z.string().optional().describe("Brief description of the label"),
});

export const createLabelTool = tool({
	description: "Create a new label",
	inputSchema: createLabelToolSchema,
	execute: async function* (input, executionOptions) {
		try {
			const { teamId } = executionOptions.experimental_context as AppContext;

			const newLabel = await createLabel({
				name: input.name,
				color: input.color,
				description: input.description,
				teamId: teamId,
			});

			yield {
				type: "text",
				text: `Label "${newLabel.name}" created successfully.`,
			};
		} catch (error) {
			console.error("Error creating task:", error);
			yield { type: "text", text: "Error creating task" };
		}
	},
});
