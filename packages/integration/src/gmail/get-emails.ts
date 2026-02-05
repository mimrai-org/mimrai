import { getLinkedUserByUserId } from "@mimir/db/queries/integrations";
import { gmail } from "googleapis/build/src/apis/gmail";
import { getBestBody } from "./decode";
import { createOAuth2Client } from "./index";

interface GetEmailsParams {
	userId: string;
	q?: string; // Gmail search query
	maxResults?: number;
	pageToken?: string;
}

interface Email {
	id: string;
	threadId: string;
	labelIds?: string[];
	snippet: string;
	from: string;
	to: string;
	subject: string;
	body: string;
	mimeType: string;
	date: string;
}

export const getEmails = async ({
	userId,
	q,
	maxResults = 10,
	pageToken,
}: GetEmailsParams) => {
	const link = await getLinkedUserByUserId({
		integrationType: "gmail",
		userId,
	});
	if (!link) {
		throw new Error("Gmail integration not linked for user");
	}

	const credentials = link.config?.credentials;

	const oauthClient = createOAuth2Client();
	oauthClient.setCredentials(credentials);

	const gmailClient = gmail({
		version: "v1",
		auth: oauthClient,
	});

	const listResponse = await gmailClient.users.messages.list({
		userId: "me",
		q,
		maxResults,
		pageToken,
	});

	const messages = listResponse.data.messages || [];

	const emails: Email[] = [];

	for (const message of messages) {
		const messageResponse = await gmailClient.users.messages.get({
			userId: "me",
			id: message.id!,
			format: "full",
		});

		const msg = messageResponse.data;

		const headers = msg.payload?.headers || [];
		const getHeader = (name: string) =>
			headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())
				?.value || "";

		const from = getHeader("From");
		const to = getHeader("To");
		const subject = getHeader("Subject");
		const date = getHeader("Date");

		const bodyInfo = getBestBody(msg);
		const body = bodyInfo?.body || "";
		const mimeType = bodyInfo?.mimeType || "text/plain";

		emails.push({
			id: msg.id!,
			threadId: msg.threadId!,
			labelIds: msg.labelIds ?? undefined,
			snippet: msg.snippet || "",
			from,
			to,
			subject,
			body,
			mimeType,
			date,
		});
	}

	return {
		emails,
		nextPageToken: listResponse.data.nextPageToken,
	};
};
