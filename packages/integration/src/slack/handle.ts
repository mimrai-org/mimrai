import { buildAppContext } from "@api/ai/agents/config/shared";
import { triageAgent } from "@api/ai/agents/triage";
import type { UIChatMessage } from "@api/ai/types";
import { getUserContext } from "@api/ai/utils/get-user-context";
import { createAdminClient } from "@api/lib/supabase";
import { checkPlanFeatures } from "@mimir/billing";
import {
	getIntegrationByType,
	getLinkedUserByExternalId,
} from "@mimir/db/queries/integrations";
import { getUserById } from "@mimir/db/queries/users";
import { trackMessage } from "@mimir/events/server";
import { getApiUrl } from "@mimir/utils/envs";
import { webApi } from "@slack/bolt";
import type { UIMessage } from "ai";
import mime from "mime-types";

export const handleSlackMessage = async ({
	message,
	messageId,
	channel,
	threadTs,
	externalUserName,
	externalUserId,
	externalTeamId,
	attachments,
}: {
	message: string;
	messageId: string;
	channel: string;
	threadTs?: string;
	externalUserName?: string;
	externalUserId: string;
	externalTeamId: string;
	attachments?: {
		url: string;
		mimeType: string;
	}[];
}) => {
	const [integration] = await getIntegrationByType({
		type: "slack",
		externalTeamId,
	});

	if (!integration) {
		throw new Error("Slack integration not found for the given team");
	}

	const associatedUser = await getLinkedUserByExternalId({
		integrationId: integration.id,
		externalUserId: externalUserId,
	});

	// Initialize Slack WebClient with the integration's access token
	const client = new webApi.WebClient(
		(integration.config as { accessToken: string }).accessToken,
	);

	const canAccess = await checkPlanFeatures(integration.teamId, ["ai"]);
	if (!canAccess) {
		await client.chat.postMessage({
			channel: channel,
			thread_ts: threadTs,
			text: "Your team plan does not include AI features. Please upgrade your plan to use this feature.",
		});
		return;
	}

	const thinkingMessage = await client.chat.postMessage({
		channel: channel,
		thread_ts: threadTs,
		text: "Processing your message...",
	});

	if (!associatedUser) {
		const url = new URL(`${getApiUrl()}/api/integrations/associate`);
		url.searchParams.append("externalUserId", externalUserId);
		externalUserName &&
			url.searchParams.append("externalUserName", externalUserName);
		url.searchParams.append("externalTeamId", externalTeamId);
		url.searchParams.append("integrationType", "slack");
		url.searchParams.append("integrationId", integration.id);

		await client.chat.postMessage({
			thread_ts: threadTs,
			channel,
			attachments: [],
			blocks: [],
			text: `Please associate your Slack account with your Mimir account by clicking the following ${url.toString()}`,
		});

		return;
	}

	try {
		const user = await getUserById(associatedUser.userId);
		if (!user) throw new Error("Associated user not found");

		const userContext = await getUserContext({
			userId: associatedUser.userId,
			teamId: integration.teamId,
		});

		const chatId = `slack-${channel}-${threadTs || "main"}`;

		const userMessage: UIChatMessage = {
			id: messageId,
			role: "user",
			parts: [{ type: "text", text: message }],
		};

		// Download and include attachments as separate message parts
		let fileIndex = 0;
		for (const { url, mimeType } of attachments || []) {
			const downloadResponse = await fetch(url, {
				headers: {
					Authorization: `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64")}`,
				},
			});
			const fileBlob = await downloadResponse.blob();
			const supabase = await createAdminClient();
			const fileExtension = mime.extension(mimeType);
			const fileId =
				new URL(url).pathname.split("/").pop() || `file-${fileIndex++}`;
			const storageFile = await supabase.storage
				.from("vault")
				.upload(
					`${associatedUser.userId}/${fileId}.${fileExtension}`,
					fileBlob,
					{
						upsert: true,
					},
				);
			const fullPath = `${process.env.SUPABASE_URL}/storage/v1/object/public/${storageFile.data?.fullPath}`;
			userMessage.parts.push({
				type: "text",
				text: `Attachment: ${fullPath}`,
			});
		}

		const appContext = buildAppContext(
			{ ...userContext, integrationType: "slack" },
			chatId,
		);

		const text: UIChatMessage = await new Promise((resolve, reject) => {
			const messageStream = triageAgent.toUIMessageStream({
				message: userMessage,
				strategy: "auto",
				maxRounds: 5,
				maxSteps: 20,
				context: appContext,
				sendFinish: true,
				onFinish: ({ responseMessage }) => {
					resolve(responseMessage as UIChatMessage);
				},
			});

			// read the stream to completion to avoid memory leaks
			(async () => {
				try {
					await messageStream.json();
				} catch (e) {
					reject(e);
				}
			})();
		});

		const body =
			text.parts[text.parts.length - 1]?.type === "text"
				? (
						text.parts[text.parts.length - 1] as UIMessage["parts"][number] & {
							type: "text";
						}
					).text
				: "Sorry, I could not process your message.";

		trackMessage({
			userId: associatedUser.userId,
			teamId: integration.teamId,
			teamName: userContext.teamName ?? "",
			source: "slack",
		});

		await client.chat.update({
			channel: channel,
			ts: thinkingMessage.ts!,
			text: body,
		});
	} catch (error) {
		await client.chat.update({
			channel: channel,
			ts: thinkingMessage.ts!,
			text: "An error occurred while processing your message",
		});
	}
};
