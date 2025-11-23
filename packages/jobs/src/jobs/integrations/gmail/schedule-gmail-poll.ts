import { getDb } from "@jobs/init";
import { integrations } from "@mimir/db/schema";
import { logger, schedules } from "@trigger.dev/sdk";
import { eq } from "drizzle-orm";
import { processUserGmailPoll } from "./process-user-gmail-poll";

export const scheduleGmailPoll = schedules.task({
	id: "schedule-gmail-poll",
	cron: "*/10 * * * *", // Every 10 minutes
	machine: {
		preset: "small-1x", //We might need to scale later on if there are too many teams or integrations.
	},
	run: async () => {
		const db = getDb();

		const gmailIntegrations = await db
			.select()
			.from(integrations)
			.where(eq(integrations.type, "gmail"));

		logger.info(`Found ${gmailIntegrations.length} Gmail integrations to poll`);

		const timestamp = Date.now();

		for (const integration of gmailIntegrations) {
			try {
				await processUserGmailPoll.trigger(
					{
						integrationId: integration.id,
						teamId: integration.teamId,
						userId: integration.userId || undefined,
					},
					{
						idempotencyKey: `gmail-poll-${integration.id}-${timestamp}`,
						tags: [
							`teamId:${integration.teamId}`,
							`integrationId:${integration.id}`,
						],
					},
				);

				logger.info(`Triggered worker for integration ${integration.id}`);
			} catch (error) {
				logger.error(
					`Failed to trigger worker for integration ${integration.id}: ${error}`,
				);
			}
		}

		logger.info(
			`Gmail polling coordinator completed - triggered ${gmailIntegrations.length} workers`,
		);
	},
});
