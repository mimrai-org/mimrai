import { tool } from "ai";
import { and, eq } from "drizzle-orm";
import z from "zod";
import { tasks } from "@/db/schema/schemas";
import { getContext } from "../context";

export const updateTaskToolSchema = z.object({
	id: z.string().describe("ID of the task to update"),
	title: z
		.string()
		.min(1)
		.optional()
		.describe(
			"New title for the task, only provide if you want to update the title",
		),
	description: z
		.string()
		.optional()
		.describe(
			"New description of the task, only provide if you want to update the description",
		),
	dueDate: z
		.string()
		.optional()
		.describe(
			"New ISO date string, only provide if you want to update the due date",
		),
	assigneeId: z
		.string()
		.optional()
		.describe(
			"New ID of the user to assign the task to, only provide if you want to update the assignee, use the getUsers tool to get the ID",
		),
	columnId: z
		.string()
		.optional()
		.describe(
			"New ID of the column to move the task to, the column is like the status of the task, use getColumns to retrieve the available columns, only provide if you want to update the column",
		),
});

export const updateTaskTool = tool({
	description: "Update an existing task in your task manager",
	inputSchema: updateTaskToolSchema,
	execute: async function* (input) {
		const { db, user } = getContext();

		yield { type: "text", text: `Updating task: ${input.title}` };
		const [updatedTask] = await db
			.update(tasks)
			.set({
				title: input.title,
				description: input.description,
				dueDate: input.dueDate
					? new Date(input.dueDate).toISOString()
					: undefined,
				columnId: input.columnId,
				assigneeId: input.assigneeId,
				teamId: user.teamId,
			})
			.where(and(eq(tasks.id, input.id), eq(tasks.teamId, user.teamId)))
			.returning();

		yield { type: "text", text: `Task updated: ${updatedTask.title}` };
	},
});
