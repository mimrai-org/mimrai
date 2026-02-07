import { getLinkedUserByUserId } from "@mimir/db/queries/integrations";
import { calendar } from "googleapis/build/src/apis/calendar";
import { oauth2Client } from ".";
import type { GoogleCalendarEvent } from "./types";

export const getEvents = async ({
	userId,
	teamId,
	filters,
}: {
	userId: string;
	teamId: string;
	filters?: {
		timeMin?: string; // ISO date string
		timeMax?: string; // ISO date string
		query?: string; // Search query
		maxResults?: number; // Maximum number of events to return
		orderBy?: "startTime" | "updated"; // Order by start time or last updated
		singleEvents?: boolean; // Whether to expand recurring events
	};
}): Promise<GoogleCalendarEvent[]> => {
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

	const response = await calendarClient.events.list({
		calendarId: "primary",
		timeMin: filters?.timeMin,
		timeMax: filters?.timeMax,
		q: filters?.query,
		maxResults: filters?.maxResults || 10,
		orderBy: filters?.orderBy || "startTime",
		singleEvents: filters?.singleEvents ?? true,
	});

	return (response.data.items || []) as GoogleCalendarEvent[];
};
