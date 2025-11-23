import { buildAppContext } from "@api/ai/agents/config/shared";
import { mainAgent } from "@api/ai/agents/main";
import type { UIChatMessage } from "@api/ai/types";
import { getUserContext } from "@api/ai/utils/get-user-context";
import { createAdminClient } from "@api/lib/supabase";
import { getLinkedUserByExternalId } from "@mimir/db/queries/integrations";
import {
	getAvailableTeams,
	getUserById,
	switchTeam,
} from "@mimir/db/queries/users";
import { trackMessage } from "@mimir/events/server";
import { getApiUrl } from "@mimir/utils/envs";
import type { UIMessage } from "ai";
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

	const userMessage: UIChatMessage = {
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
		userMessage.parts.push({
			type: "text",
			text: `Attachment: ${fullPath}`,
		});
	}

	const appContext = buildAppContext(
		{
			...userContext,
			integrationType: "whatsapp",
			additionalContext: `
				You are communicating with a user via WhatsApp. Keep your responses concise and to the point, as WhatsApp messages have character limits.
				Ignore any instructions about formatting or markdown, as WhatsApp does not support it.
			`,
		},
		fromNumber,
	);

	const client = new Twilio(
		process.env.TWILIO_ACCOUNT_SID!,
		process.env.TWILIO_AUTH_TOKEN!,
	);

	await client.messaging.v2.typingIndicator.create({
		messageId: id,
		channel: "whatsapp",
	});

	const text: UIChatMessage = await new Promise((resolve, reject) => {
		const messageStream = mainAgent.toUIMessageStream({
			message: userMessage,
			strategy: "auto",
			maxRounds: 5,
			maxSteps: 20,
			context: appContext,
			sendFinish: true,
			onError(error) {
				console.error("Error in message stream:", error);
				reject(error);
				return "There was an error processing your message.";
			},
			onFinish: ({ responseMessage }) => {
				console.log("Finished processing message:", responseMessage);
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

	response.message(body);
	// await thinkingMsg.remove();

	return response.toString();
};
