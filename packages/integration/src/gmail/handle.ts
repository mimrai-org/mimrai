import { log } from "@integration/logger";
import type { IntegrationConfig } from "@integration/registry";
import { db } from "@mimir/db/client";
import { getLinkedUserByExternalId } from "@mimir/db/queries/integrations";
import {
	integrationLogs,
	integrations,
	integrationUserLink,
} from "@mimir/db/schema";
import { tasks } from "@trigger.dev/sdk";
import { startOfDay } from "date-fns";
import { and, count, eq } from "drizzle-orm";
import { gmail } from "googleapis/build/src/apis/gmail";
import { createOAuth2Client, oauth2Client } from ".";
import { decodeEmail, getHeader } from "./decode";

export const handle = async ({
	email,
	historyId,
}: {
	email: string;
	historyId: string;
}) => {
	const links = await db
		.select()
		.from(integrationUserLink)
		.innerJoin(
			integrations,
			eq(integrationUserLink.integrationId, integrations.id),
		)
		.where(
			and(
				eq(integrationUserLink.integrationType, "gmail"),
				eq(integrationUserLink.externalUserId, email),
			),
		);

	for (const {
		integration_user_link: link,
		integrations: integration,
	} of links) {
		const config = link.config as IntegrationConfig<"gmail">;
		const credentials = link.config?.credentials;

		const oauthClient = createOAuth2Client();
		oauthClient.setCredentials(credentials);
		const latestHistoryId = link.config?.latestHistoryId || historyId;

		const gmailClient = gmail({
			version: "v1",
			auth: oauthClient,
		});

		const messageResponse = await gmailClient.users.history.list({
			userId: "me",
			startHistoryId: latestHistoryId,
		});

		await db
			.update(integrationUserLink)
			.set({
				config: {
					...link.config,
					latestHistoryId: messageResponse.data.historyId,
				},
			})
			.where(eq(integrationUserLink.id, link.id));

		const data = messageResponse.data;

		if (!data.history || data.history.length === 0) {
			console.log("No new history records found.");
			continue;
		}

		for (const historyRecord of data.history) {
			if (!historyRecord.messagesAdded) continue;

			for (const messageAdded of historyRecord.messagesAdded) {
				const { message } = messageAdded;
				console.log({ messageAdded });
				if (!message) continue;

				if (!message.id) continue;

				// only process messages in INBOX
				if (!message.labelIds || !message.labelIds.includes("INBOX")) {
					continue;
				}

				const messageDetail = await gmailClient.users.messages.get({
					userId: "me",
					id: message.id,
					format: "full",
				});

				const decoded = decodeEmail(messageDetail.data);

				// ignore promotions and social
				if (message.labelIds.includes("CATEGORY_PROMOTIONS")) {
					continue;
				}
				if (message.labelIds.includes("CATEGORY_SOCIAL")) {
					continue;
				}

				// filter from addresses
				if (
					config.filters?.onlyFromAddresses &&
					config.filters.onlyFromAddresses.length > 0
				) {
					if (
						decoded.from &&
						!config.filters.onlyFromAddresses.includes(decoded.from)
					) {
						continue;
					}
				}

				// filter subject
				if (config.filters?.subjectMatching) {
					const regex = new RegExp(config.filters.subjectMatching, "i");
					if (!regex.test(decoded.subject)) {
						continue;
					}
				}

				// filter body
				if (config.filters?.bodyMatching) {
					const regex = new RegExp(config.filters.bodyMatching, "i");
					if (!regex.test(decoded.body)) {
					}
				}

				//Get logs count in the last day
				const [c] = await db
					.select({
						count: count(integrationLogs.userLinkId),
					})
					.from(integrationLogs)
					.where(
						and(
							eq(integrationLogs.integrationId, integration.id),
							eq(integrationLogs.userLinkId, link.id),
							eq(integrationLogs.key, "email_processed"),
							eq(
								integrationLogs.createdAt,
								startOfDay(new Date()).toISOString(),
							),
						),
					);

				if (c?.count && c.count >= 1000) {
					console.log(
						"Log limit reached for the day, skipping email processing.",
					);
					continue;
				}

				// Trigger process job
				await tasks.trigger("process-user-email", {
					decodedEmail: decoded,
					userId: link.userId,
					teamId: integration.teamId,
				});

				log({
					integrationId: integration.id,
					level: "info",
					key: "email_processed",
					userLinkId: link.id,
					message: `Processed email from ${decoded.from} with subject "${decoded.subject}"`,
				});
			}
		}
	}

	return;
};
