import { setContext } from "@api/ai/context";
import { generateSystemPrompt } from "@api/ai/generate-system-prompt";
import { createToolRegistry } from "@api/ai/tool-types";
import { getOrSetIntegrationTeamTool } from "@api/ai/tools/get-or-set-integration-team";
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
import { getLinkedUserByExternalId } from "@mimir/db/queries/integrations";
import {
	getAvailableTeams,
	getUserById,
	switchTeam,
} from "@mimir/db/queries/users";
import { trackMessage } from "@mimir/events/server";
import { getApiUrl } from "@mimir/utils/envs";
import {
	convertToModelMessages,
	stepCountIs,
	streamText,
	type UIMessage,
} from "ai";
import mime from "mime-types";
import { Twilio, twiml } from "twilio";

export const handleWhatsappMessage = async ({
	id,
	message,
	fromNumber,
	fromName,
	attachments,
}: {
	id: string;
	message: string;
	fromNumber: string;
	fromName: string;
	attachments?: {
		url: string;
		contentType: string;
	}[];
}) => {
	const response = new twiml.MessagingResponse();

	const associetedUser = await getLinkedUserByExternalId({
		externalUserId: fromNumber,
	});
	if (!associetedUser) {
		const url = `${getApiUrl()}/api/integrations/associate?externalUserId=${encodeURIComponent(
			fromNumber,
		)}&externalUserName=${encodeURIComponent(
			fromName,
		)}&integrationType=whatsapp`;
		response.message(
			`Please associate your WhatsApp number with your account by clicking the following ${url}`,
		);
		return response.toString();
	}

	const user = await getUserById(associetedUser.userId);
	if (!user) throw new Error("Associated user not found");

	// Auto assign teamId if missing
	if (!user.teamId) {
		const availableTeams = await getAvailableTeams(associetedUser.userId);
		if (availableTeams.length > 0) {
			await switchTeam(associetedUser.userId, availableTeams[0]!.id);
			user.teamId = availableTeams[0]!.id;
		}
	}

	const userContext = await getUserContext({
		userId: associetedUser.userId,
		teamId: user.teamId!,
	});

	const chat = await getChatById(fromNumber);
	if (!chat) {
		await saveChat({
			chatId: fromNumber,
			userId: associetedUser.userId,
		});
	}

	const relevantMessages: UIChatMessage[] = [...(chat?.messages || [])];
	const newMessage: UIChatMessage = {
		id,
		role: "user",
		parts: [{ type: "text", text: message }],
	};

	// Download and include attachments as separate message parts
	let fileIndex = 0;
	for (const { url, contentType } of attachments || []) {
		const downloadResponse = await fetch(url, {
			headers: {
				Authorization: `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64")}`,
			},
		});
		const fileBlob = await downloadResponse.blob();
		const supabase = await createAdminClient();
		const fileExtension = mime.extension(contentType);
		const fileId =
			new URL(url).pathname.split("/").pop() || `file-${fileIndex++}`;
		const storageFile = await supabase.storage
			.from("vault")
			.upload(`${associetedUser.userId}/${fileId}.${fileExtension}`, fileBlob, {
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
		chatId: fromNumber,
		userId: associetedUser.userId,
		message: newMessage,
	});

	setContext({
		db: db,
		user: userContext,
		// @ts-expect-error
		writer: null,
		artifactSupport: false,
	});

	const client = new Twilio(
		process.env.TWILIO_ACCOUNT_SID!,
		process.env.TWILIO_AUTH_TOKEN!,
	);

	const systemPrompt = `You are responding to a chat ON WHATSAPP, DO NOT RESPOND WITH MARKDOWNS AND DO NOT SEND LINKS. Always inlcude **${
		userContext.teamName
	}** on the top of your responses to identify the team.
  If the user want to change team, use the tool "getOrSetIntegrationTeam" to do so.
  ${generateSystemPrompt(userContext)}`;

	// const thinkingMsg = await client.messages.create({
	//   from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER!}`,
	//   to: `whatsapp:${fromNumber}`,
	//   body: "Thinking...",
	// });

	await trackMessage({
		userId: userContext.userId,
		source: "whatsapp",
		teamName: userContext.teamName ?? undefined,
	});

	const text: UIChatMessage = await new Promise((resolve, reject) => {
		const result = streamText({
			model: "openai/gpt-4o",
			system: systemPrompt,
			messages: convertToModelMessages(relevantMessages),
			tools: {
				...createToolRegistry(),
				getOrSetIntegrationTeam: getOrSetIntegrationTeamTool,
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
		chatId: fromNumber,
		userId: associetedUser.userId,
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

	response.message(body);
	// await thinkingMsg.remove();

	return response.toString();
};
