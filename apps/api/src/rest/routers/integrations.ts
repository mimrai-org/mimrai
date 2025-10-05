import { OpenAPIHono } from "@hono/zod-openapi";
import { db } from "@/db";
import { integrationUserLink } from "@/db/schema/schemas";
import { associateMattermostUserSchema } from "@/schemas/integrations";
import type { Context } from "../types";

const app = new OpenAPIHono<Context>();

app.get("/mattermost/associate", async (c) => {
	const query = c.req.query();
	const safeQuery = associateMattermostUserSchema.safeParse(query);

	if (!safeQuery.success) {
		return c.json({ success: false, error: safeQuery.error }, 400);
	}

	const session = c.get("session");
	const userId = session.userId;

	await db.insert(integrationUserLink).values({
		integrationId: safeQuery.data.integrationId,
		userId: userId,
		externalUserId: safeQuery.data.mattermostUserId,
		externalUserName: safeQuery.data.mattermostUserName,
	});

	const html_body = `
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

	return c.html(html_body);
});

export { app as integrationsRouter };
