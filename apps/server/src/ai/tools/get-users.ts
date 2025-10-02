import { tool } from "ai";
import z from "zod";
import { getUsers } from "@/db/queries/users";
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

export const getUsersTool = tool({
	description: "Get users from your team",
	inputSchema: getTasksToolSchema,
	execute: async function* ({ search, cursor, pageSize }) {
		const { db, user } = getContext();

		const result = await getUsers({
			teamId: user.teamId,
			cursor,
			pageSize,
			search,
		});

		if (result.data.length === 0) {
			yield { type: "text", text: "No users found." };
			return;
		}

		yield result;
	},
});
