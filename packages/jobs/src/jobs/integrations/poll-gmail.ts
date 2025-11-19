import { db } from "@mimir/db/client";
import { integrations } from "@mimir/db/schema";
import { IntakeManager } from "@mimir/integration/gmail/intake-manager";
import { GmailManager } from "@mimir/integration/gmail/manager";
import type { IntegrationConfig } from "@mimir/integration/registry";
import { logger, schedules } from "@trigger.dev/sdk/v3";
import { eq } from "drizzle-orm";

export const pollGmailJob = schedules.task({
	id: "gmail-polling-job",
	cron: "*/15 * * * *", // Every 15 minutes
	machine: {
		preset: "medium-2x", // 1 vCPU, 2GB RAM
	},
	run: async () => {
		// Fetch all Gmail integrations
		const gmailIntegrations = await db
			.select()
			.from(integrations)
			.where(eq(integrations.type, "gmail"));

		logger.info(`Found ${gmailIntegrations.length} Gmail integrations to poll`);

		const intakeManager = new IntakeManager();

		// Process each integration
		for (const integration of gmailIntegrations) {
			try {
				// Cast config to Gmail config since we filtered by type 'gmail'
				const config = integration.config as IntegrationConfig<"gmail">;

				const gmailManager = new GmailManager(config);

				// Level 0 & 1: Fetch & Metadata Filter
				const messages = await gmailManager.getNewMessages();

				logger.info(
					`Integration ${integration.id}: Found ${messages.length} new messages after Level 1 filter`,
				);

				if (messages.length > 0) {
					// Process in smaller chunks to avoid OOM
					const CHUNK_SIZE = 20;
					let totalProcessed = 0;

					for (let i = 0; i < messages.length; i += CHUNK_SIZE) {
						const chunk = messages.slice(i, i + CHUNK_SIZE);

						logger.info(
							`Processing chunk ${i / CHUNK_SIZE + 1}/${Math.ceil(messages.length / CHUNK_SIZE)} (${chunk.length} messages)`,
						);

						// Level 2 & 3: AI Filter & Save
						const processedCount = await intakeManager.processGmailBatch(
							integration.userId || undefined,
							integration.teamId,
							config,
							chunk,
							gmailManager,
						);

						totalProcessed += processedCount;

						// Force garbage collection between chunks if available
						if (global.gc) {
							global.gc();
						}
					}

					logger.info(
						`Integration ${integration.id}: Total processed ${totalProcessed} actionable items`,
					);
				}

				// Update lastSyncedAt only after successful processing
				await db
					.update(integrations)
					.set({
						config: {
							...config,
							lastSyncedAt: new Date().toISOString(),
						},
						updatedAt: new Date().toISOString(),
					})
					.where(eq(integrations.id, integration.id));
			} catch (error) {
				logger.error(
					`Failed to process integration ${integration.id}: ${error}`,
				);
			}
		}
	},
});
