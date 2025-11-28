import { getDb } from "@jobs/init";
import { teams, users, usersOnTeams } from "@mimir/db/schema";
import { schedules } from "@trigger.dev/sdk";
import { eq } from "drizzle-orm";
import { followUpTeamJob } from "./follow-up-team-job";

export const scheduleDailyFollowUp = schedules.task({
	id: "schedule-daily-follow-up",
	cron: "0 1 * * *", // Every day at 1 AM
	description: "Schedule daily follow-up tasks for users",
	run: async (payload, ctx) => {
		const db = getDb();
		const teamsList = await db.select().from(teams);

		for (const team of teamsList) {
			// Queue follow-up task for each user
			await followUpTeamJob.trigger(
				{
					teamId: team.id,
				},
				{
					idempotencyKey: `daily-follow-up-${team.id}-${new Date().toISOString().split("T")[0]}`,
					tags: [`teamId:${team.id}`, `teamName:${team.name}`],
				},
			);
		}
	},
});
