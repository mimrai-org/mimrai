import { getTaskById } from "@mimir/db/queries/tasks";
import { tool } from "ai";
import { htmlToText } from "html-to-text";
import z from "zod";
import { getToolContext } from "../agents/config/shared";

export const getTaskByIdToolSchema = z.object({
	id: z.string().describe("Task ID"),
});

export const getTaskByIdTool = tool({
	description: "Retrieve a task by ID",
	inputSchema: getTaskByIdToolSchema,
	execute: async function* ({ id }, executionOptions) {
		try {
			const { userId, teamId, teamSlug, writer } =
				getToolContext(executionOptions);

			const result = await getTaskById(id, userId);
			if (!result) {
				yield { type: "text", text: "Task not found." };
				return;
			}

			if (writer) {
				writer.write({
					type: "data-task",
					data: {
						id: result.id,
						title: result.title,
						description: result.description,
						statusId: result.statusId,
						assignee: result.assigneeId,
						dueDate: result.dueDate,
						sequence: result.sequence,
					},
				});
			}

			yield {
				...result,
				description: htmlToText(result.description || ""),
			};
		} catch (error) {
			console.error("Error in getTaskByIdTool:", error);
			throw error;
		}
	},
});
