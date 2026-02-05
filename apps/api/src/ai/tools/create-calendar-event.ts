import { createEvent } from "@mimir/integration/google-calendar";
import { tool } from "ai";
import z from "zod";
import type { AppContext } from "../agents/config/shared";

export const createCalendarEventToolSchema = z.object({
	summary: z.string().min(1).describe("Event title"),
	start: z
		.object({
			dateTime: z.string().describe("Start date and time in ISO format"),
			timeZone: z
				.string()
				.optional()
				.describe("Timezone, e.g., 'America/New_York'"),
		})
		.describe("Event start time"),
	end: z
		.object({
			dateTime: z.string().describe("End date and time in ISO format"),
			timeZone: z
				.string()
				.optional()
				.describe("Timezone, e.g., 'America/New_York'"),
		})
		.describe("Event end time"),
	description: z.string().optional().describe("Event description"),
	location: z.string().optional().describe("Event location"),
});

export const createCalendarEventTool = tool({
	description: "Create a new event in Google Calendar",
	inputSchema: createCalendarEventToolSchema,
	execute: async function* (input, executionOptions) {
		try {
			const { userId, teamId, behalfUserId } =
				executionOptions.experimental_context as AppContext;
			yield {
				text: `Creating calendar event: ${input.summary}`,
			};

			const event = await createEvent({
				userId: behalfUserId,
				teamId,
				event: input,
			});

			yield {
				text: `Event created successfully with ID: ${event.id}`,
			};

			return event;
		} catch (error) {
			console.error("Failed to create calendar event:", error);
			throw new Error(`Failed to create calendar event: ${error}`);
		}
	},
});
