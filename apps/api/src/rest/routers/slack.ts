import { OpenAPIHono } from "@hono/zod-openapi";
import { installIntegration } from "@mimir/db/queries/integrations";
import { getTeamById } from "@mimir/db/queries/teams";
import { getApiUrl, getAppUrl } from "@mimir/utils/envs";
import { webApi } from "@slack/bolt";
import type { Context } from "../types";

const app = new OpenAPIHono<Context>();

app.get("/oauth/callback", async (c) => {
	const teamId = c.get("teamId");
	const team = await getTeamById(teamId!);
	if (!team) {
		return c.json({ error: "Team not found" }, 404);
	}

	const code = c.req.query("code");

	const client = new webApi.WebClient();
	const result = await client.oauth.v2.access({
		client_id: process.env.SLACK_CLIENT_ID!,
		client_secret: process.env.SLACK_CLIENT_SECRET!,
		code: code,
		redirect_uri: `${getApiUrl()}/api/slack/oauth/callback`,
	});

	if (!result.ok) {
		console.error("Slack OAuth failed:", result.error);
		return c.json({ error: "OAuth failed" }, 400);
	}

	const externalTeamId = result.team?.id;
	const accessToken = result.access_token;

	await installIntegration({
		type: "slack",
		config: {
			accessToken: accessToken!,
		},
		teamId: teamId!,
		externalTeamId: externalTeamId!,
	});

	return c.redirect(`${getAppUrl()}/team/${team.slug}/settings/integrations`);
});

export { app as slackRouter };
