import {
	getLinkedUserByUserId,
	updateLinkedUser,
} from "@mimir/db/queries/integrations";
import { gmail } from "googleapis/build/src/apis/gmail";
import { handle, oauth2Client } from ".";

export const watchGmail = async ({
	userId,
	teamId,
}: {
	userId: string;
	teamId: string;
}) => {
	const link = await getLinkedUserByUserId({
		userId,
		integrationType: "gmail",
		teamId,
	});

	if (!link) {
		throw new Error("No linked Gmail integration found for user");
	}

	console.log("Setting up Gmail watch for user:", userId);

	oauth2Client.setCredentials(link.config?.credentials);

	const gmailClient = gmail({
		version: "v1",
		auth: oauth2Client,
	});

	const response = await gmailClient.users
		.watch({
			userId: "me",
			requestBody: {
				labelIds: ["INBOX"],
				topicName: process.env.GMAIL_PUBSUB_TOPIC || "",
				labelFilterBehavior: "INCLUDE",
			},
		})
		.catch((error) => {
			console.error("Error setting up Gmail watch:", error);
			throw error;
		});

	const data = response.data;

	if (data.historyId) {
		// trigger initial sync here if needed
		await updateLinkedUser({
			userId,
			teamId,
			integrationType: "gmail",
			config: {
				...link.config,
				latestHistoryId: data.historyId,
			},
		});
	}

	console.log("Gmail watch response:", response.data);
};
