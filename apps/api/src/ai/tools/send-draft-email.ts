import { sendDraftEmail } from "@mimir/integration/gmail";
import { tool } from "ai";
import z from "zod";
import { getToolContext } from "../agents/config/shared";

export const sendDraftEmailTool = tool({
	description: "Send a draft email in Gmail",
	inputSchema: z.object({
		id: z.string().min(1).describe("Draft email ID"),
	}),
	execute: async function* (input, executionOptions) {
		const { teamId, userId, behalfUserId } = getToolContext(executionOptions);

		const draft = await sendDraftEmail({
			id: input.id,
			userId: behalfUserId,
		});

		yield {
			type: "text",
			text: `Draft email sent successfully. You can view it here: ${draft.url}`,
		};
	},
});
