import { getDb } from "@jobs/init";
import { integrations, integrationUserLink } from "@mimir/db/schema";
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

		const gmailLinkedUsers = await db
			.select({
				userId: integrationUserLink.userId,
				externalUserId: integrationUserLink.externalUserId,
				integrationId: integrationUserLink.integrationId,
				teamId: integrations.teamId,
			})
			.from(integrationUserLink)
			.innerJoin(
				integrations,
				eq(integrationUserLink.integrationId, integrations.id),
			)
			.where(eq(integrationUserLink.integrationType, "gmail"));

		logger.info(`Found ${gmailLinkedUsers.length} Gmail linked users to poll`);

		if (gmailLinkedUsers.length === 0) {
			logger.info("No Gmail linked users found, skipping");
			return;
		}

		const timestamp = Date.now();
		let triggeredCount = 0;

		for (const linkedUser of gmailLinkedUsers) {
			if (!linkedUser.integrationId) {
				logger.warn(`User ${linkedUser.userId} has no integrationId, skipping`);
				continue;
			}

			try {
				await processUserGmailPoll.trigger(
					{
						integrationId: linkedUser.integrationId,
						teamId: linkedUser.teamId,
						userId: linkedUser.userId,
						externalUserId: linkedUser.externalUserId,
					},
					{
						idempotencyKey: `gmail-poll-${linkedUser.userId}-${timestamp}`,
						tags: [
							`userId:${linkedUser.userId}`,
							`integrationId:${linkedUser.integrationId}`,
						],
					},
				);

				triggeredCount++;
			} catch (error) {
				logger.error(
					`Failed to trigger worker for user ${linkedUser.userId}: ${error}`,
				);
			}
		}

		logger.info(
			`Gmail polling coordinator completed - triggered ${triggeredCount} workers`,
		);
	},
});
