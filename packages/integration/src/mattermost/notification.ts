import { Client4 } from "@mattermost/client";
import {
	getIntegrationByType,
	getLinkedUserByUserId,
} from "@mimir/db/queries/integrations";

export const sendMattermostNotification = async ({
	teamId,
	userId,
	message,
}: {
	teamId: string;
	userId?: string;
	message: string;
}) => {
	const integration = await getIntegrationByType({
		type: "mattermost",
		teamId: teamId,
	});
	if (!integration) {
		throw new Error("No Mattermost integration found for team");
	}
	const config = integration.config as {
		token: string;
		url: string;
		teamNotificationChannelId?: string;
	};
	const token = config.token;
	const url = config.url;
	if (!token || !url) {
		throw new Error("Invalid Mattermost integration configuration");
	}

	const client = new Client4();
	client.setUrl(url);
	client.setToken(token);

	const me = await client.getMe();

	if (!userId) {
		const teamChannelId = config.teamNotificationChannelId;
		if (!teamChannelId) {
			throw new Error(
				"No userId provided and no team notification channel configured",
			);
		}
		await client.createPost({
			channel_id: teamChannelId,
			message: message,
		});
		return;
	}

	const linkedUser = await getLinkedUserByUserId({
		integrationId: integration.id,
		userId: userId,
		teamId: teamId,
	});

	if (!linkedUser) {
		throw new Error(`No linked Mattermost user found for user ${userId}`);
	}

	const externalId = linkedUser.externalUserId;

	const channel = await client.createDirectChannel([externalId, me.id]);
	await client.createPost({
		channel_id: channel.id,
		message: message,
	});

	return true;
};
