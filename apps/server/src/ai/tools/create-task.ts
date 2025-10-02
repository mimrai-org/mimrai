import { tool } from "ai";
import z from "zod";
import { tasks } from "@/db/schema/schemas";
import { getContext } from "../context";

export const createTaskToolSchema = z.object({
	title: z
		.string()
		.min(1)
		.describe(
			"Title of the task, do not ask if not provided, generate if not provided",
		),
	description: z
		.string()
		.optional()
		.describe(
			"Description of the task, do not ask if not provided, generate if not provided",
		),
	assigneeId: z
		.string()
		.optional()
		.describe(
			"ID of the user to assign the task to, do not ask if not provided, if provided you can use the getUsers tool to get the ID",
		),
	dueDate: z
		.string()
		.optional()
		.describe("ISO date string, do not ask if not provided"),
	columnId: z
		.string()
		.describe(
			"ID of the column to add the task to, do not ask, get it from the getColumns tool",
		),
});

export const createTaskTool = tool({
	description: "Create a new task in your task manager",
	inputSchema: createTaskToolSchema,
	execute: async function* (input) {
		const { db, user } = getContext();

		yield { type: "text", text: `Creating task: ${input.title}` };
		const [newTask] = await db
			.insert(tasks)
			.values({
				title: input.title,
				description: input.description,
				dueDate: input.dueDate
					? new Date(input.dueDate).toISOString()
					: undefined,
				columnId: input.columnId,
				assigneeId: input.assigneeId,
				teamId: user.teamId,
			})
			.returning();

		yield { type: "text", text: `Task created: ${newTask.title}` };
	},
});
