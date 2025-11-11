import { setContext } from "@api/ai/context";
import { generateSystemPrompt } from "@api/ai/generate-system-prompt";
import { createToolRegistry } from "@api/ai/tool-types";
import type { UIChatMessage } from "@api/ai/types";
import { getUserContext } from "@api/ai/utils/get-user-context";
import { createAdminClient } from "@api/lib/supabase";
import { shouldForceStop } from "@api/utils/streaming-utils";
import { db } from "@mimir/db/client";
import {
	getChatById,
	saveChat,
	saveChatMessage,
} from "@mimir/db/queries/chats";
import {
	getIntegrationByType,
	getLinkedUserByExternalId,
} from "@mimir/db/queries/integrations";
import {
	getAvailableTeams,
	getUserById,
	switchTeam,
} from "@mimir/db/queries/users";
import { trackMessage } from "@mimir/events/server";
import { getApiUrl } from "@mimir/utils/envs";
import { type SlackEventMiddlewareArgs, webApi } from "@slack/bolt";
import {
	convertToModelMessages,
	stepCountIs,
	streamText,
	type UIMessage,
} from "ai";
import mime from "mime-types";
import { getSlackClient } from "./client";

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

	const user = await getUserById(associatedUser.userId);
	if (!user) throw new Error("Associated user not found");

	const userContext = await getUserContext({
		userId: associatedUser.userId,
		teamId: integration.teamId,
	});

	const chatId = `slack-${channel}-${threadTs || "main"}`;
	const chat = await getChatById(chatId);
	if (!chat) {
		await saveChat({
			chatId,
			userId: associatedUser.userId,
		});
	}

	const relevantMessages: UIChatMessage[] = [...(chat?.messages || [])];
	const newMessage: UIChatMessage = {
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
			.upload(`${associatedUser.userId}/${fileId}.${fileExtension}`, fileBlob, {
				upsert: true,
			});
		const fullPath = `${process.env.SUPABASE_URL}/storage/v1/object/public/${storageFile.data?.fullPath}`;
		newMessage.parts.push({
			type: "text",
			text: `Attachment: ${fullPath}`,
		});
	}

	relevantMessages.push(newMessage);

	await saveChatMessage({
		chatId,
		userId: associatedUser.userId,
		message: newMessage,
	});

	setContext({
		db: db,
		user: userContext,
		// @ts-expect-error
		writer: null,
		artifactSupport: false,
	});

	const systemPrompt = `${generateSystemPrompt(userContext)}`;

	await trackMessage({
		userId: userContext.userId,
		source: "slack",
		teamName: userContext.teamName ?? undefined,
	});

	const text: UIChatMessage = await new Promise((resolve, reject) => {
		const result = streamText({
			model: "openai/gpt-4o",
			system: systemPrompt,
			messages: convertToModelMessages(relevantMessages),
			tools: {
				...createToolRegistry(),
			},
			onStepFinish: async (step) => {},
			stopWhen: (step) => {
				// Stop if we've reached 10 steps (original condition)
				if (stepCountIs(10)(step)) {
					return true;
				}

				// Force stop if any tool has completed its full streaming response
				return shouldForceStop(step);
			},
		});

		const messageStream = result.toUIMessageStream({
			sendFinish: true,
			onFinish: ({ responseMessage }) => {
				resolve(responseMessage as UIChatMessage);
			},
		});

		// read the stream to completion to avoid memory leaks
		(async () => {
			try {
				for await (const _part of messageStream) {
					// no-op
				}
			} catch (error) {
				reject(error);
			}
		})();
	});

	await saveChatMessage({
		chatId,
		userId: associatedUser.userId,
		message: text,
	});

	const body =
		text.parts[text.parts.length - 1]?.type === "text"
			? (
					text.parts[text.parts.length - 1] as UIMessage["parts"][number] & {
						type: "text";
					}
				).text
			: "Sorry, I could not process your message.";

	await client.chat.postMessage({
		channel: channel,
		thread_ts: threadTs,
		text: body,
	});
};
