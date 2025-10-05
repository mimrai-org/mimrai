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
			"ID of the user to assign the task to. Try to assign it to someone if possible guessing from the users description from the getUsers tool output, do not ask if not provided",
		),
	priority: z
		.enum(["low", "medium", "high"])
		.optional()
		.describe(
			"Priority of the task, can be low, medium or high, do not ask if not provided, evaluate from the title and description if possible",
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

	attachments: z
		.array(z.url())
		.optional()
		.describe(
			"List of attachment URLs for the task, only provide if you want to add attachments",
		),
});

export const createTaskTool = tool({
	description:
		"Create a new task in your board. Always call the getUsers and getColumns tools before using this tool to get the IDs needed for assigneeId and columnId",
	inputSchema: createTaskToolSchema,
	execute: async function* (input) {
		try {
			const { db, user, artifactSupport } = getContext();

			yield { text: `Creating task: ${input.title}` };
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
					priority: input.priority || "medium",
					teamId: user.teamId,
					attachments: input.attachments || [],
				})
				.returning();

			yield {
				type: "text",
				text: `Task created: ${newTask.title}`,
				forceStop: artifactSupport,
			};
		} catch (error) {
			console.error("Error creating task:", error);
			yield { type: "text", text: "Error creating task" };
		}
	},
});
