import { getEvents } from "@mimir/integration/google-calendar";
import { tool } from "ai";
import z from "zod";
import type { AppContext } from "../agents/config/shared";

export const getCalendarEventsToolSchema = z.object({
	timeMin: z
		.string()
		.optional()
		.describe("Start time for events (ISO date string)"),
	timeMax: z
		.string()
		.optional()
		.describe("End time for events (ISO date string)"),
	query: z.string().optional().describe("Search query to filter events"),
	maxResults: z
		.number()
		.optional()
		.describe("Maximum number of events to return (default: 10)"),
	orderBy: z
		.enum(["startTime", "updated"])
		.optional()
		.describe("Order events by start time or last updated"),
	singleEvents: z
		.boolean()
		.optional()
		.describe("Whether to expand recurring events into individual instances"),
});

export const getCalendarEventsTool = tool({
	description:
		"Get calendar events from Google Calendar with optional filtering",
	inputSchema: getCalendarEventsToolSchema,
	execute: async function* (input, executionOptions) {
		try {
			const { userId, teamId, behalfUserId } =
				executionOptions.experimental_context as AppContext;

			const events = await getEvents({
				userId: behalfUserId,
				teamId,
				filters: input,
			});

			const eventSummaries = events.map((event) => ({
				id: event.id,
				summary: event.summary,
				start: event.start,
				end: event.end,
				description: event.description,
				location: event.location,
				status: event.status,
			}));

			yield {
				text: `Found ${events.length} events`,
				data: eventSummaries,
			};
		} catch (error) {
			console.error("Failed to get calendar events:", error);
			throw new Error(`Failed to get calendar events: ${error}`);
		}
	},
});
