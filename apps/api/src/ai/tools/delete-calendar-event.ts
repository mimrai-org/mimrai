import { deleteEvent } from "@mimir/integration/google-calendar";
import { tool } from "ai";
import z from "zod";
import { getToolContext } from "../agents/config/shared";

export const deleteCalendarEventToolSchema = z.object({
	eventId: z.string().describe("The ID of the event to delete"),
});

export const deleteCalendarEventTool = tool({
	description: "Delete an event from Google Calendar",
	inputSchema: deleteCalendarEventToolSchema,
	execute: async function* (input, executionOptions) {
		try {
			const { userId, teamId, behalfUserId } = getToolContext(executionOptions);
			yield {
				text: `Deleting calendar event: ${input.eventId}`,
			};

			await deleteEvent({
				userId: behalfUserId,
				teamId,
				eventId: input.eventId,
			});

			yield {
				text: "Event deleted successfully",
			};

			return { success: true };
		} catch (error) {
			console.error("Failed to delete calendar event:", error);
			throw new Error(`Failed to delete calendar event: ${error}`);
		}
	},
});
