import { createTaskComment } from "@mimir/db/queries/tasks";
import { tool } from "ai";
import z from "zod";
import { getToolContext } from "../agents/config/shared";

export const createTaskCommentToolSchema = z.object({
	taskId: z.string().describe("The ID (uuid) of the task to comment on"),
	comment: z.string().min(1).describe("The comment text to add to the task"),
	mentions: z
		.array(z.string())
		.optional()
		.describe("Array of user IDs (uuid) to mention in the comment"),
});

export const createTaskCommentTool = tool({
	description:
		"Add a comment to an existing task. Use this to communicate progress, ask questions, or provide updates on a task.",
	inputSchema: createTaskCommentToolSchema,
	execute: async function* (input, executionOptions) {
		try {
			const { userId, teamId } = getToolContext(executionOptions);

			yield {
				text: "Adding comment to task...",
			};

			const activity = await createTaskComment({
				taskId: input.taskId,
				userId,
				teamId,
				comment: input.comment,
				mentions: input.mentions,
			});

			yield {
				type: "text",
				text: "Comment added successfully",
				activityId: activity?.id,
			};
		} catch (error) {
			console.error("Error creating task comment:", error);
			yield {
				type: "text",
				text: `Error adding comment: ${error instanceof Error ? error.message : "Unknown error"}`,
			};
		}
	},
});
