import { getMembers } from "@db/queries/teams";
import { tool } from "ai";
import z from "zod";
import type { AppContext } from "../agents/config/shared";
import { getContext } from "../context";

export const getTasksToolSchema = z.object({
	search: z
		.string()
		.optional()
		.describe("Partial title of the task to filter by"),
});

export const getUsersTool = tool({
	description: "Get members/users of your team",
	inputSchema: getTasksToolSchema,
	execute: async function* ({ search }, executionOptions) {
		const { teamId } = executionOptions.experimental_context as AppContext;

		yield { text: "Retrieving users..." };

		const result = await getMembers({
			teamId: teamId,
			search,
		});

		if (result.length === 0) {
			yield { type: "text", text: "No users found." };
			return;
		}

		yield {
			text: `Found ${result.length} users.`,
			data: result,
		};
	},
});
