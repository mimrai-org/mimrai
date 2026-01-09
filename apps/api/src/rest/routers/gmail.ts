import { OpenAPIHono } from "@hono/zod-openapi";
import { db } from "@mimir/db/client";
import {
	installIntegration,
	linkUserToIntegration,
} from "@mimir/db/queries/integrations";
import { getTeamById } from "@mimir/db/queries/teams";
import { session } from "@mimir/db/schema";
import { generateAuthUrl, oauth2Client } from "@mimir/integration/gmail";
import { getAppUrl } from "@mimir/utils/envs";
import { eq } from "drizzle-orm";
import { protectedMiddleware } from "../middleware";
import type { Context } from "../types";

const app = new OpenAPIHono<Context>();

app.get("oauth", ...protectedMiddleware, async (c) => {
	const { authorizationUrl, state } = generateAuthUrl();
	const cSession = c.get("session");

	await db
		.update(session)
		.set({ metadata: { gmailState: state } })
		.where(eq(session.id, cSession.id));

	return c.redirect(authorizationUrl);
});

app.get("oauth/callback", ...protectedMiddleware, async (c) => {
	const { code, state, error } = c.req.query();
	const cSession = c.get("session");
	const [dbSession] = await db
		.select()
		.from(session)
		.where(eq(session.id, cSession.id))
		.limit(1);
	const dbState = dbSession?.metadata?.gmailState;
	const teamId = c.get("teamId");
	const userId = c.get("userId");

	if (state !== dbState) {
		return c.json({ error: "Invalid state parameter" }, 400);
	}

	const { tokens } = await oauth2Client.getToken(code);

	// decode id token to get user info
	const ticket = await oauth2Client.verifyIdToken({
		idToken: tokens.id_token || "",
	});
	const payload = ticket.getPayload();

	if (!payload || !payload.email) {
		return c.json({ error: "Failed to verify ID token" }, 400);
	}

	const integration = await installIntegration({
		type: "gmail",
		config: {},
		teamId,
	});

	const link = await linkUserToIntegration({
		integrationId: integration.id,
		userId,
		accessToken: tokens.access_token,
		refreshToken: tokens.refresh_token,
		externalUserId: payload.email,
		externalUserName: payload.email,
		integrationType: "gmail",
		config: {
			credentials: tokens,
		},
	});

	const team = await getTeamById(teamId);

	return c.redirect(`${getAppUrl()}/team/${team.slug}/settings/integrations`);
});

export { app as gmail };
