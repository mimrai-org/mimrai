import { getGmailClient } from "./client";
import { decodeBase64Url, findBody, sanitizeContent } from "./utils";

export const fetchMailsByIds = async (ids: string[]) => {
	const gmail = getGmailClient();

	const mails = await Promise.all(
		ids.map(async (id) => {
			const response = await gmail.users.messages.get({
				userId: "me",
				id: id,
				format: "full",
			});

			const payload = response.data.payload;
			if (!payload) return null;

			// get subject
			const subject =
				payload.headers?.find((h) => h.name === "Subject")?.value ||
				"No Subject";

			// get from
			const from =
				payload.headers?.find((h) => h.name === "From")?.value || "Unknown";

			// get date
			const date = payload.headers?.find((h) => h.name === "Date")?.value;

			let bodyHtml = "";
			let bodyPlain = "";

			if (payload.parts) {
				const { html, plain } = findBody(payload.parts);
				bodyHtml = html;
				bodyPlain = plain;
			} else if (payload.body?.data) {
				const decoded = decodeBase64Url(payload.body.data);
				if (payload.mimeType?.includes("html")) {
					bodyHtml = decoded;
					bodyPlain = sanitizeContent(decoded);
				} else {
					bodyPlain = decoded;
				}
			}

			if (bodyHtml && !bodyPlain) {
				bodyPlain = sanitizeContent(bodyHtml);
			}

			return {
				id,
				subject,
				from,
				date,
				body: bodyPlain, // Sanitized text for AI processing
				originalHtml: bodyHtml, // Original HTML for display
			};
		}),
	);

	return mails.filter((c) => c !== null);
};
