import { getEmails } from "@mimir/integration/gmail";
import { tool } from "ai";
import z from "zod";
import { getToolContext } from "../agents/config/shared";

export const getEmailsToolSchema = z.object({
	q: z
		.string()
		.optional()
		.describe(
			"Gmail search query (e.g., 'from:someone@example.com', 'subject:important', 'has:attachment')",
		),
	maxResults: z
		.number()
		.min(1)
		.max(50)
		.default(10)
		.describe("Maximum number of emails to retrieve (1-50)"),
	pageToken: z.string().optional().describe("Page token for pagination"),
});

export const getEmailsTool = tool({
	description: "Retrieve emails from Gmail with optional filtering",
	inputSchema: getEmailsToolSchema,
	execute: async function* ({ q, maxResults, pageToken }, executionOptions) {
		try {
			const { userId, writer, behalfUserId } = getToolContext(executionOptions);

			const result = await getEmails({
				userId: behalfUserId,
				q,
				maxResults,
				pageToken,
			});

			if (result.emails.length === 0) {
				yield { type: "text", text: "No emails found matching the criteria." };
				return;
			}

			const mappedEmails = result.emails.map((email) => ({
				id: email.id,
				from: email.from,
				to: email.to,
				subject: email.subject,
				date: email.date,
				snippet: email.snippet,
				body:
					email.body.length > 500
						? email.body.substring(0, 500) + "..."
						: email.body,
				mimeType: email.mimeType,
				labelIds: email.labelIds,
				threadId: email.threadId,
			}));

			if (writer) {
				for (const email of mappedEmails) {
					writer.write({
						type: "data-email",
						data: email,
					});
				}
			}

			const response = {
				emails: mappedEmails,
				total: result.emails.length,
				query: q || null,
				nextPageToken: result.nextPageToken || null,
			};

			yield response;
		} catch (error) {
			console.error("Error in getEmailsTool:", error);
			throw new Error(
				`Failed to retrieve emails: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	},
});
