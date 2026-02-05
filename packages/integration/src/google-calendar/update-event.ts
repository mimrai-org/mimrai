import { getLinkedUserByUserId } from "@mimir/db/queries/integrations";
import { calendar } from "googleapis/build/src/apis/calendar";
import { oauth2Client } from ".";

export const updateEvent = async ({
	userId,
	teamId,
	eventId,
	event,
}: {
	userId: string;
	teamId: string;
	eventId: string;
	event: Partial<{
		summary: string;
		start: { dateTime: string; timeZone?: string };
		end: { dateTime: string; timeZone?: string };
		description: string;
		location: string;
	}>;
}) => {
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

	const response = await calendarClient.events.update({
		calendarId: "primary",
		eventId,
		requestBody: event,
	});

	return response.data;
};
