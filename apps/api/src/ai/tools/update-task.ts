import { updateTask } from "@mimir/db/queries/tasks";
import { tool } from "ai";
import z from "zod";
import type { AppContext } from "../agents/config/shared";

export const updateTaskToolSchema = z.object({
	id: z.string().describe("Task ID to update"),
	title: z.string().min(1).optional().describe("Title"),
	description: z.string().optional().describe("Description"),
	dueDate: z.string().optional().describe("Due Date in ISO 8601 format"),
	assigneeId: z.string().optional().describe("User assignee ID"),
	statusId: z.string().optional().describe("Status ID"),
	milestoneId: z.string().optional().describe("Milestone ID"),
	projectId: z.string().optional().describe("Project ID"),

	attachments: z.array(z.url()).optional().describe("List of attachment URLs"),

	priority: z
		.enum(["low", "medium", "high", "urgent"])
		.optional()
		.describe("Priority level"),
});

export const updateTaskTool = tool({
	description:
		"Update a task, including title, description, due date, assignee, column, attachments, and priority",
	inputSchema: updateTaskToolSchema,
	execute: async function* (input, executionOptions) {
		try {
			const { userId, teamId } =
				executionOptions.experimental_context as AppContext;

			yield { type: "text", text: `Updating task: ${input.title}` };
			const updatedTask = await updateTask({
				...input,
				id: input.id,
				teamId,
				userId,
			});

			yield { type: "text", text: `Task updated: ${updatedTask.title}` };
		} catch (error) {
			console.error("Error updating task:", error);
		}
	},
});
