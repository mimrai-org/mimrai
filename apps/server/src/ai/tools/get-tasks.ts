import { tool } from "ai";
import z from "zod";
import { getTasks } from "@/db/queries/tasks";
import { getContext } from "../context";

export const getTasksToolSchema = z.object({
	search: z
		.string()
		.optional()
		.describe("Partial title of the task to filter by"),
	cursor: z
		.string()
		.optional()
		.describe(
			"Cursor for pagination, representing the last item from the previous page",
		),
	pageSize: z
		.number()
		.min(1)
		.max(25)
		.default(10)
		.describe("Number of transactions to return per page (1-25)"),
});

export const getTasksTool = tool({
	description: "Get columns from your task manager",
	inputSchema: getTasksToolSchema,
	execute: async function* ({ search, cursor, pageSize }) {
		const { db, user } = getContext();

		const result = await getTasks({
			teamId: user.teamId,
			cursor,
			pageSize,
			search,
		});

		if (result.data.length === 0) {
			yield { type: "text", text: "No tasks found." };
			return;
		}

		yield result;
	},
});
