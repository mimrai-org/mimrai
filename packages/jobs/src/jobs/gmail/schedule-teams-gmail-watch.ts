import { getDb } from "@jobs/init";
import { integrations, integrationUserLink } from "@mimir/db/schema";
import { watchGmail } from "@mimir/integration/gmail";
import { schedules } from "@trigger.dev/sdk";
import { and, eq } from "drizzle-orm";

export const teamsGmailWatch = schedules.task({
	id: "schedule-teams-gmail-watch",
	// Run every day at midnight
	cron: "0 0 * * *",
	run: async (payload, ctx) => {
		const db = getDb();
		const links = await db
			.select()
			.from(integrationUserLink)
			.innerJoin(
				integrations,
				eq(integrationUserLink.integrationId, integrations.id),
			)
			.where(and(eq(integrationUserLink.integrationType, "gmail")));

		console.log(`Found ${links.length} Gmail links to set up watches for`);
		for (const link of links) {
			await watchGmail({
				userId: link.integration_user_link.userId,
				teamId: link.integrations.teamId,
			});
		}
	},
});
