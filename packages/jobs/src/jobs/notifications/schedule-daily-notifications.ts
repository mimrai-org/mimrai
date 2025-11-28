import { TZDate } from "@date-fns/tz";
import { getDb } from "@jobs/init";
import { teams, users, usersOnTeams } from "@mimir/db/schema";
import { schedules } from "@trigger.dev/sdk";
import { format, set } from "date-fns";
import { eq } from "drizzle-orm";
import { createDigestActivityJob } from "./create-digest-activity";
import { createEODActivityJob } from "./create-eod-activity";

export const scheduleDailyNotificationsJob = schedules.task({
	id: "schedule-daily-notifications",
	cron: "0 5 * * *", // Every day at 5am
	run: async (payload, ctx) => {
		const db = getDb();

		const usersOnTeamsList = await db
			.select()
			.from(usersOnTeams)
			.innerJoin(users, eq(users.id, usersOnTeams.userId))
			.innerJoin(teams, eq(teams.id, usersOnTeams.teamId));

		for (const userOnTeam of usersOnTeamsList) {
			const date = TZDate.tz(userOnTeam.teams.timezone);
			const digestDate = set(date, { hours: 9, minutes: 0, seconds: 0 });

			if (digestDate > date)
				await createDigestActivityJob.trigger(
					{
						userId: userOnTeam.user.id,
						teamId: userOnTeam.users_on_teams.teamId,
						userName: userOnTeam.user.name,
					},
					{
						delay: digestDate,
						idempotencyKey: `daily-digest-${userOnTeam.user.id}-${userOnTeam.users_on_teams.teamId}-${format(digestDate, "yyyy-MM-dd")}`,
						tags: [
							`userName:${userOnTeam.user.name}`,
							`teamId:${userOnTeam.users_on_teams.teamId}`,
							`userId:${userOnTeam.user.id}`,
						],
					},
				);

			const eodDate = set(date, { hours: 17, minutes: 0, seconds: 0 });

			if (eodDate > date)
				await createEODActivityJob.trigger(
					{
						userId: userOnTeam.user.id,
						teamId: userOnTeam.users_on_teams.teamId,
						userName: userOnTeam.user.name,
					},
					{
						delay: eodDate,
						idempotencyKey: `daily-eod-${userOnTeam.user.id}-${userOnTeam.users_on_teams.teamId}-${format(eodDate, "yyyy-MM-dd")}`,
						tags: [
							`userName:${userOnTeam.user.name}`,
							`teamId:${userOnTeam.users_on_teams.teamId}`,
							`userId:${userOnTeam.user.id}`,
						],
					},
				);
		}
	},
});
