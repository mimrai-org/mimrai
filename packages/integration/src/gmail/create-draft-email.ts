import { getLinkedUserByUserId } from "@mimir/db/queries/integrations";
import { gmail } from "googleapis/build/src/apis/gmail";
import { createOAuth2Client } from "./index";

interface CreateDraftEmailParams {
	to: string;
	subject: string;
	body: string;
	userId: string;
}

export const createDraftEmail = async ({
	to,
	subject,
	body,
	userId,
}: CreateDraftEmailParams) => {
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

	const base64EncodedBody = Buffer.from(
		`To: ${to}\nSubject: ${subject}\n\n${body}`,
	).toString("base64url");

	const draft = await gmailClient.users.drafts.create({
		userId: "me",
		requestBody: {
			message: {
				raw: base64EncodedBody,
			},
		},
	});

	const url = `https://mail.google.com/mail/u/0/#drafts?compose=${draft.data.id}`;
	return {
		id: draft.data.id!,
		url,
	};
};
