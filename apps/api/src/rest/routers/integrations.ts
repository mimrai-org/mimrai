import {
	associateMattermostUserSchema,
	associeteIntegrationUserSchema,
} from "@api/schemas/integrations";
import { db } from "@db/index";
import { getIntegrationById } from "@db/queries/integrations";
import { integrationUserLink } from "@db/schema";
import { OpenAPIHono } from "@hono/zod-openapi";
import { sendMattermostNotification } from "@mimir/integration/mattermost";
import { sendWhatsappNotification } from "@mimir/integration/whatsapp";
import { and, eq, type SQL } from "drizzle-orm";
import type { Context } from "../types";

const app = new OpenAPIHono<Context>();

const RESPONSE_HTML = `
        <html>
            <head>
                <script type="text/javascript">
                    window.close();
                </script>            
            </head>
            <body>
                <p>Operation succcessful. You can safely close this window.</p>
            </body>
        </html>

    `;

app.get("/mattermost/associate", async (c) => {
	const query = c.req.query();
	const safeQuery = associateMattermostUserSchema.safeParse(query);

	if (!safeQuery.success) {
		return c.json({ success: false, error: safeQuery.error }, 400);
	}

	const session = c.get("session");
	const userId = session.userId;

	const [existingLink] = await db
		.select()
		.from(integrationUserLink)
		.where(
			and(
				eq(integrationUserLink.integrationId, safeQuery.data.integrationId),
				eq(integrationUserLink.userId, userId),
				eq(integrationUserLink.externalUserId, safeQuery.data.mattermostUserId),
			),
		)
		.limit(1);

	if (existingLink) {
		return c.html(RESPONSE_HTML);
	}

	await db.insert(integrationUserLink).values({
		integrationId: safeQuery.data.integrationId,
		userId: userId,
		externalUserId: safeQuery.data.mattermostUserId,
		externalUserName: safeQuery.data.mattermostUserName,
	});

	const html_body = RESPONSE_HTML;

	return c.html(html_body);
});

app.get("/associate", async (c) => {
	const query = c.req.query();
	const safeQuery = associeteIntegrationUserSchema.safeParse(query);

	if (!safeQuery.success) {
		return c.json({ success: false, error: safeQuery.error }, 400);
	}

	const session = c.get("session");
	const teamId = c.get("teamId");
	const userId = session.userId;

	const whereClause: SQL[] = [
		eq(integrationUserLink.userId, userId),
		eq(integrationUserLink.externalUserId, safeQuery.data.externalUserId),
	];

	if (safeQuery.data.integrationId) {
		whereClause.push(
			eq(integrationUserLink.integrationId, safeQuery.data.integrationId),
		);
	}

	if (safeQuery.data.integrationType) {
		whereClause.push(
			eq(integrationUserLink.integrationType, safeQuery.data.integrationType),
		);
	}

	const [existingLink] = await db
		.select()
		.from(integrationUserLink)
		.where(and(...whereClause))
		.limit(1);

	if (existingLink) {
		return c.html(RESPONSE_HTML);
	}

	await db.insert(integrationUserLink).values({
		integrationId: safeQuery.data.integrationId,
		integrationType: safeQuery.data.integrationType,
		userId: userId,
		externalUserId: safeQuery.data.externalUserId,
		externalUserName: safeQuery.data.externalUserName,
	});

	// Provide feedback for specific integration types if needed
	if (safeQuery.data.integrationType) {
		switch (safeQuery.data.integrationType) {
			case "mattermost": {
				sendMattermostNotification({
					message:
						"Mattermost integration successfully linked to your account.",
					teamId: teamId,
					userId: userId,
				});
				break;
			}
			case "whatsapp": {
				sendWhatsappNotification({
					message: "WhatsApp integration successfully linked to your account.",
					teamId: teamId,
					teamName: "",
					userId: [userId],
				});
				break;
			}
		}
	}

	const html_body = RESPONSE_HTML;

	return c.html(html_body);
});

export { app as integrationsRouter };
