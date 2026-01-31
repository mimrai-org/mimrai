import { getLinkedUserByUserId } from "@mimir/db/queries/integrations";
import { gmail } from "googleapis/build/src/apis/gmail";
import { createOAuth2Client } from "./index";

interface SendDraftEmailParams {
	id: string;
	userId: string;
}

export const sendDraftEmail = async ({ id, userId }: SendDraftEmailParams) => {
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

	const sended = await gmailClient.users.drafts.send({
		userId: "me",
		requestBody: {
			id,
		},
	});

	const url = `https://mail.google.com/mail/u/0/#sent?compose=${sended.data.id}`;
	return {
		id: sended.data.id!,
		url,
	};
};
