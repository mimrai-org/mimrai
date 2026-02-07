import { getLinkedUserByUserId } from "@mimir/db/queries/integrations";
import { calendar } from "googleapis/build/src/apis/calendar";
import { oauth2Client } from ".";

export const deleteEvent = async ({
	userId,
	teamId,
	eventId,
}: {
	userId: string;
	teamId: string;
	eventId: string;
}): Promise<{ success: boolean }> => {
	const link = await getLinkedUserByUserId({
		userId,
		integrationType: "google-calendar",
		teamId,
	});

	if (!link || !link.accessToken || !link.config?.credentials) {
		throw new Error("Google Calendar not linked for this user");
	}

	oauth2Client.setCredentials(link.config.credentials);

	const calendarClient = calendar({
		version: "v3",
		auth: oauth2Client,
	});

	await calendarClient.events.delete({
		calendarId: "primary",
		eventId,
	});

	return { success: true };
};
