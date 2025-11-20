import { db } from "@mimir/db/client";
import { integrations } from "@mimir/db/schema";
import { GmailHandle } from "@mimir/integration/gmail/handle";
import type { IntegrationConfig } from "@mimir/integration/registry";
import { logger, schedules, schemaTask } from "@trigger.dev/sdk/v3";
import { eq } from "drizzle-orm";
import z from "zod";

//TODO: Right now, each worker is created for each integration, there’s a lot of parallelism,
// but there’s an underlying concurrency issue with duplicate intakes within a team when they share context.
// So, it might be necessary to segment by team instead of by integration.

// Worker job: processes a single Gmail integration
export const processGmailIntegrationJob = schemaTask({
	id: "process-gmail-integration",
	schema: z.object({
		integrationId: z.string(),
		teamId: z.string(),
		userId: z.string().optional(),
	}),
	machine: {
		preset: "small-1x",
	},
	run: async (payload) => {
		const { integrationId, teamId, userId } = payload;

		logger.info(`Processing integration ${integrationId}...`);

		const [integration] = await db
			.select()
			.from(integrations)
			.where(eq(integrations.id, integrationId));

		if (!integration) {
			throw new Error(`Integration ${integrationId} not found`);
		}

		const config = integration.config as IntegrationConfig<"gmail">;

		const gmailHandle = new GmailHandle(config, logger);

		const processedCount = await gmailHandle.processIntegration({
			userId: userId || undefined,
			teamId,
		});

		logger.info(
			`Integration ${integrationId}: Processed ${processedCount} actionable items`,
		);

		await db
			.update(integrations)
			.set({
				config: {
					...config,
					lastSyncedAt: new Date().toISOString(),
				},
				updatedAt: new Date().toISOString(),
			})
			.where(eq(integrations.id, integrationId));

		logger.info(`Integration ${integrationId}: Updated lastSyncedAt timestamp`);

		return { processedCount };
	},
});

// Coordinator job: triggers a worker for each Gmail integration
export const pollGmailCoordinatorJob = schedules.task({
	id: "gmail-polling-coordinator",
	cron: "*/10 * * * *", // Every 10 minutes
	machine: {
		preset: "small-1x", //We might need to scale later on if there are too many teams or integrations.
	},
	run: async () => {
		const gmailIntegrations = await db
			.select()
			.from(integrations)
			.where(eq(integrations.type, "gmail"));

		logger.info(`Found ${gmailIntegrations.length} Gmail integrations to poll`);

		const timestamp = Date.now();

		for (const integration of gmailIntegrations) {
			try {
				await processGmailIntegrationJob.trigger(
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
