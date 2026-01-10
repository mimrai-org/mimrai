import { TZDate } from "@date-fns/tz";
import { autopilotSettings, teams } from "@mimir/db/schema";
import { logger, schedules } from "@trigger.dev/sdk";
import { eq } from "drizzle-orm";
import { getDb } from "../../init";
import { generateTeamSuggestionsJob } from "./generate-team-suggestions-job";

export const scheduleDailyTeamsSuggestions = schedules.task({
	id: "schedule-daily-teams-suggestions",
	cron: "0 1 * * *", // Every day at 1 AM
	description: "Schedule daily follow-up tasks for users",
	run: async (payload, ctx) => {
		const db = getDb();
		const teamsList = await db.select().from(teams);

		for (const team of teamsList) {
			const [settings] = await db
				.select()
				.from(autopilotSettings)
				.where(eq(autopilotSettings.teamId, team.id))
				.limit(1);

			if (!settings || !settings.enabled) {
				logger.info(
					`Autopilot settings disabled for team ID ${team.id}. Exiting.`,
				);
				continue;
			}

			const executionDate = new TZDate(new Date(), team.timezone || "UTC");
			executionDate.setHours(9, 0, 0, 0); // Set to 9:00 AM in team's timezone

			// Queue follow-up task for each user
			await generateTeamSuggestionsJob.trigger(
				{
					teamId: team.id,
				},
				{
					idempotencyKey: `daily-teams-suggestions-${team.id}-${new Date().toISOString().split("T")[0]}`,
					tags: [`teamId:${team.id}`, `teamName:${team.name}`],
					delay: executionDate,
				},
			);
		}
	},
});
