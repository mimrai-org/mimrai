import { associateMattermostUserSchema } from "@api/schemas/integrations";
import { db } from "@db/index";
import { integrationUserLink } from "@db/schema";
import { OpenAPIHono } from "@hono/zod-openapi";
import { and, eq } from "drizzle-orm";
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

export { app as integrationsRouter };
