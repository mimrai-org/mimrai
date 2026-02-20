import { sendSmtpEmail } from "@mimir/integration/smtp";
import { tool } from "ai";
import z from "zod";
import { getToolContext } from "../agents/config/shared";

export const sendEmailTool = tool({
	description:
		"Send an email using the configured SMTP integration for your team",
	inputSchema: z.object({
		to: z
			.union([z.string().email(), z.array(z.string().email()).min(1)])
			.describe("Recipient email address or list of recipient email addresses"),
		subject: z.string().min(1).describe("Email subject"),
		text: z.string().optional().describe("Plain text body"),
		html: z.string().optional().describe("HTML body"),
		cc: z
			.union([z.string().email(), z.array(z.string().email()).min(1)])
			.optional()
			.describe("CC recipient(s)"),
		bcc: z
			.union([z.string().email(), z.array(z.string().email()).min(1)])
			.optional()
			.describe("BCC recipient(s)"),
	}),
	execute: async function* (input, executionOptions) {
		const { teamId, behalfUserId } = getToolContext(executionOptions);

		const result = await sendSmtpEmail({
			teamId,
			userId: behalfUserId,
			to: input.to,
			subject: input.subject,
			text: input.text,
			html: input.html,
			cc: input.cc,
			bcc: input.bcc,
		});

		yield {
			type: "text",
			text: `Email sent successfully. Message ID: ${result.messageId}`,
			data: result,
		};
	},
});
