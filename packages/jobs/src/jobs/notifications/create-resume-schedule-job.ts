import { getDb } from "@jobs/init";
import { resumeSettings, teams } from "@mimir/db/schema";
import { schedules } from "@trigger.dev/sdk";
import { and, eq, isNull, or } from "drizzle-orm";
import { sendResumeJob } from "./send-resume-job";

export const ResumeSchedule = schedules.task({
  id: "create-resume-schedule",
  cron: "0 0 * * *", // Every day at midnight
  description: "Schedule the resume for every team",
  run: async (payload, ctx) => {
    const db = getDb();

    const allTeams = await db.select().from(teams);

    for (const team of allTeams) {
      const [settings] = await db
        .select()
        .from(resumeSettings)
        .where(
          and(
            eq(resumeSettings.teamId, team.id),
            eq(resumeSettings.enabled, true),
            or(
              isNull(resumeSettings.jobId),
              eq(resumeSettings.shouldUpdateJob, true)
            )
          )
        )
        .limit(1);

      if (!settings) continue;

      const job = await schedules.create({
        task: sendResumeJob.id,
        cron: settings.cronExpression,
        deduplicationKey: `resume-schedule-${team.id}`,
        externalId: team.id,
        timezone: team.timezone || "UTC",
      });

      await db
        .update(resumeSettings)
        .set({
          jobId: job.id,
          nextRunAt: job.nextRun?.toISOString() || null,
          lastRunAt: new Date().toISOString(),
          shouldUpdateJob: false,
        })
        .where(eq(resumeSettings.id, settings.id));
    }
  },
});
