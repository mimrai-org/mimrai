import { getMembers } from "@mimir/db/queries/teams";
import { tool } from "ai";
import z from "zod";
import { getToolContext } from "../agents/config/shared";

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
		const { teamId } = getToolContext(executionOptions);

		yield { text: "Retrieving users..." };

		const result = await getMembers({
			teamId: teamId,
			search,
			includeSystemUsers: true,
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
