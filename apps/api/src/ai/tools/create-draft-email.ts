import { createDraftEmail } from "@mimir/integration/gmail";
import { tool } from "ai";
import z from "zod";
import type { AppContext } from "../agents/config/shared";

export const createDraftEmailTool = tool({
	description: "Create a draft email in Gmail",
	inputSchema: z.object({
		to: z.string().min(1).describe("Recipient email address"),
		subject: z.string().min(1).describe("Subject of the email"),
		body: z.string().min(1).describe("Body content of the email"),
	}),
	execute: async function* (input, executionOptions) {
		const { teamId, userId } =
			executionOptions.experimental_context as AppContext;

		const draft = await createDraftEmail({
			to: input.to,
			subject: input.subject,
			body: input.body,
			userId: userId,
		});

		yield {
			type: "text",
			text: `Draft email created successfully. You can view it here: ${draft.url}`,
		};
	},
});
