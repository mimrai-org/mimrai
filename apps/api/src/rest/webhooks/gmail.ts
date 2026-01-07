import crypto from "node:crypto";
import { OpenAPIHono } from "@hono/zod-openapi";
import { handle, oauth2Client } from "@mimir/integration/gmail";
import type { EventFromType } from "@slack/bolt";
import type { MiddlewareHandler } from "hono";
import type { Context } from "../types";

const app = new OpenAPIHono<Context>();

const verifySignature: MiddlewareHandler = async (c, next) => {
	// Verify that the push request originates from Cloud Pub/Sub.
	try {
		// Get the Cloud Pub/Sub-generated JWT in the "Authorization" header.
		const bearer = c.req.header("Authorization");
		const [, token] = bearer.match(/Bearer (.*)/);

		// Verify and decode the JWT.
		// Note: For high volume push requests, it would save some network
		// overhead if you verify the tokens offline by decoding them using
		// Google's Public Cert; caching already seen tokens works best when
		// a large volume of messages have prompted a single push server to
		// handle them, in which case they would all share the same token for
		// a limited time window.
		const ticket = await oauth2Client.verifyIdToken({
			idToken: token,
			audience: "mimrai.com",
		});

		const claim = ticket.getPayload();

		// IMPORTANT: you should validate claim details not covered
		// by signature and audience verification above, including:
		//   - Ensure that `claim.email` is equal to the expected service
		//     account set up in the push subscription settings.
		//   - Ensure that `claim.email_verified` is set to true.

		if (claim.aud !== "mimrai.com") {
			throw new Error("Invalid audience");
		}

		if (claim.email_verified !== true) {
			throw new Error("Email not verified");
		}

		await next();
	} catch (e) {
		return c.json({ error: "Unauthorized" }, 401);
	}
};

app.post(verifySignature, async (c) => {
	const event = await c.req.json();

	// decode the message data from base64
	const userData = JSON.parse(
		Buffer.from(event.message.data, "base64").toString("utf-8"),
	) as {
		emailAddress: string;
		historyId: string;
	};

	await handle({
		email: userData.emailAddress,
		historyId: userData.historyId,
	});

	return c.json({ received: true });
});

export { app as gmailWebhook };
