import { updateEvent } from "@mimir/integration/google-calendar";
import { tool } from "ai";
import z from "zod";
import { getToolContext } from "../agents/config/shared";

export const updateCalendarEventToolSchema = z.object({
	eventId: z.string().describe("The ID of the event to update"),
	summary: z.string().optional().describe("Updated event title"),
	start: z
		.object({
			dateTime: z
				.string()
				.describe("Updated start date and time in ISO format"),
			timeZone: z.string().optional().describe("Timezone"),
		})
		.optional()
		.describe("Updated event start time"),
	end: z
		.object({
			dateTime: z.string().describe("Updated end date and time in ISO format"),
			timeZone: z.string().optional().describe("Timezone"),
		})
		.optional()
		.describe("Updated event end time"),
	description: z.string().optional().describe("Updated event description"),
	location: z.string().optional().describe("Updated event location"),
});

export const updateCalendarEventTool = tool({
	description: "Update an existing event in Google Calendar",
	inputSchema: updateCalendarEventToolSchema,
	execute: async function* (input, executionOptions) {
		try {
			const { userId, teamId, behalfUserId } = getToolContext(executionOptions);
			const { eventId, ...updates } = input;
			yield {
				text: `Updating calendar event: ${eventId}`,
			};

			const event = await updateEvent({
				userId: behalfUserId,
				teamId,
				eventId,
				event: updates,
			});

			yield {
				text: "Event updated successfully",
			};

			return event;
		} catch (error) {
			console.error("Failed to update calendar event:", error);
			throw new Error(`Failed to update calendar event: ${error}`);
		}
	},
});
