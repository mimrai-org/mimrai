import {
	getLinkedUserByExternalId,
	getLinkedUserByUserId,
} from "@mimir/db/queries/integrations";
import { Twilio } from "twilio";

export const sendWhatsappNotification = async ({
	message,
	teamId,
	teamName,
	userId,
}: {
	userId?: string[];
	teamId: string;
	teamName: string;
	message: string;
}) => {
	if (!userId || userId.length === 0) {
		throw new Error("No userId provided for WhatsApp notification");
	}

	const integrationUsers = (
		await Promise.all(
			userId.map((id) =>
				getLinkedUserByUserId({
					userId: id,
					integrationType: "whatsapp",
				}),
			),
		)
	).filter(Boolean);

	if (!integrationUsers || integrationUsers.length === 0) {
		throw new Error(`No linked Whatsapp user found for user ${userId}`);
	}

	// Send the notification using the WhatsApp API
	const client = new Twilio(
		process.env.TWILIO_ACCOUNT_SID!,
		process.env.TWILIO_AUTH_TOKEN!,
	);

	for (const integrationUser of integrationUsers) {
		if (!integrationUser) {
			continue;
		}

		await client.messages.create({
			to: `whatsapp:${integrationUser.externalUserId}`,
			from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER!}`,
			body: message,
		});
	}
};
