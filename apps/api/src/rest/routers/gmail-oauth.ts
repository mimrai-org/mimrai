import { randomUUID } from "node:crypto";
import { withAuth } from "@api/rest/middleware/auth";
import type { Context } from "@api/rest/types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { db } from "@mimir/db/client";
import { createIntegrationUserLink } from "@mimir/db/queries/integrations";
import { integrations } from "@mimir/db/schema";
import { and, eq } from "drizzle-orm";
import { google } from "googleapis";

const gmailOAuthRouter = new OpenAPIHono<Context>();

gmailOAuthRouter.use("*", withAuth);
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
	console.error(
		"Missing required environment variables: GOOGLE_CLIENT_ID and/or GOOGLE_CLIENT_SECRET",
	);
}

// Store for state validation (in production, use Redis)
const stateStore = new Map<
	string,
	{ userId: string; teamId: string; expiresAt: number }
>();

gmailOAuthRouter.get("/authorize", async (c) => {
	if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
		return c.json(
			{
				error:
					"Gmail OAuth is not configured on the server, Gmail integration is not available",
			},
			500,
		);
	}

	const session = c.get("session");
	const teamId = c.get("teamId");

	if (!session) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const state = randomUUID();
	stateStore.set(state, {
		userId: session.userId,
		teamId,
		expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
	});

	const oauth2Client = new google.auth.OAuth2(
		process.env.GOOGLE_CLIENT_ID,
		process.env.GOOGLE_CLIENT_SECRET,
		`${process.env.API_URL || "http://localhost:3003"}/api/integrations/gmail/callback`,
	);

	const authUrl = oauth2Client.generateAuthUrl({
		access_type: "offline",
		scope: ["https://www.googleapis.com/auth/gmail.readonly"],
		state,
		prompt: "consent",
	});

	return c.redirect(authUrl);
});

gmailOAuthRouter.get("/callback", async (c) => {
	const code = c.req.query("code");
	const state = c.req.query("state");
	const error = c.req.query("error");

	if (error) {
		return c.redirect(
			`${process.env.APP_URL || "http://localhost:3000"}/dashboard/settings/integrations?error=${error}`,
		);
	}

	if (!code || !state) {
		return c.json({ error: "Missing code or state" }, 400);
	}

	const stateData = stateStore.get(state);
	if (!stateData || stateData.expiresAt < Date.now()) {
		return c.json({ error: "Invalid or expired state" }, 400);
	}

	stateStore.delete(state);

	const oauth2Client = new google.auth.OAuth2(
		process.env.GOOGLE_CLIENT_ID,
		process.env.GOOGLE_CLIENT_SECRET,
		`${process.env.API_URL || "http://localhost:3003"}/api/integrations/gmail/callback`,
	);

	try {
		const { tokens } = await oauth2Client.getToken(code);

		if (!tokens.refresh_token) {
			return c.json(
				{
					error:
						"No refresh token received. Please revoke access and try again.",
				},
				400,
			);
		}

		if (!tokens.access_token) {
			return c.json(
				{
					error: "No access token received from Google",
				},
				400,
			);
		}

		oauth2Client.setCredentials(tokens);

		const gmail = google.gmail({ version: "v1", auth: oauth2Client });
		const profile = await gmail.users.getProfile({ userId: "me" });

		if (!profile.data.emailAddress) {
			return c.json(
				{
					error: "Failed to fetch email address from Gmail",
				},
				400,
			);
		}

		const googleEmail = profile.data.emailAddress;
		const googleUserId = googleEmail;

		const [existingIntegration] = await db
			.select()
			.from(integrations)
			.where(
				and(
					eq(integrations.type, "gmail"),
					eq(integrations.teamId, stateData.teamId),
				),
			)
			.limit(1);

		let integrationId: string;

		if (existingIntegration) {
			await db
				.update(integrations)
				.set({
					config: {
						refreshToken: tokens.refresh_token,
						accessToken: tokens.access_token,
						expiresAt: tokens.expiry_date,
						mode: "auto",
						allowDomains: [],
						allowSenders: [],
						denyDomains: [],
						denySenders: [],
					},
					updatedAt: new Date().toISOString(),
				})
				.where(eq(integrations.id, existingIntegration.id));
			integrationId = existingIntegration.id;
		} else {
			const [newIntegration] = await db
				.insert(integrations)
				.values({
					teamId: stateData.teamId,
					name: "Gmail",
					type: "gmail",
					config: {
						refreshToken: tokens.refresh_token,
						accessToken: tokens.access_token,
						expiresAt: tokens.expiry_date,
						mode: "auto",
						allowDomains: [],
						allowSenders: [],
						denyDomains: [],
						denySenders: [],
					},
				})
				.returning();
			integrationId = newIntegration.id;
		}

		await createIntegrationUserLink({
			userId: stateData.userId,
			externalUserId: googleUserId,
			externalUserName: googleEmail,
			integrationId,
			integrationType: "gmail",
		});

		return c.redirect(
			`${process.env.APP_URL || "http://localhost:3000"}/dashboard/settings/integrations?success=gmail`,
		);
	} catch (error) {
		console.error("OAuth callback error:", error);
		return c.redirect(
			`${process.env.APP_URL || "http://localhost:3000"}/dashboard/settings/integrations?error=oauth_failed`,
		);
	}
});

export default gmailOAuthRouter;
