import { db } from "@mimir/db/client";
import { integrations } from "@mimir/db/schema";
import { GmailHandle } from "@mimir/integration/gmail/handle";
import type { IntegrationConfig } from "@mimir/integration/registry";
import { logger, schemaTask } from "@trigger.dev/sdk/v3";
import { eq } from "drizzle-orm";
import z from "zod";

export const processUserGmailPoll = schemaTask({
	id: "process-user-gmail-poll",
	schema: z.object({
		integrationId: z.string(),
		teamId: z.string(),
		userId: z.string(),
		externalUserId: z.string(),
	}),
	run: async (payload) => {
		const { integrationId, teamId, userId, externalUserId } = payload;

		logger.info(
			`Processing Gmail for user ${userId} (external: ${externalUserId})`,
		);

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
			userId,
			teamId,
		});

		logger.info(`User ${userId}: Processed ${processedCount} actionable items`);

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

		logger.info(
			`Updated lastSyncedAt timestamp for integration ${integrationId}`,
		);

		return { processedCount };
	},
});
