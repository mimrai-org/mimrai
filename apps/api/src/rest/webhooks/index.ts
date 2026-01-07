import { OpenAPIHono } from "@hono/zod-openapi";
import { alexaWebhook } from "./alexa";
import { githubWebhook } from "./github";
import { gmailWebhook } from "./gmail";
import { slackWebhookApp } from "./slack";
import { stripeWebhook } from "./stripe";
import { twilioWebhook } from "./twilio";

const webhooks = new OpenAPIHono();

webhooks.route("/slack", slackWebhookApp);
webhooks.route("/stripe", stripeWebhook);
webhooks.route("/github", githubWebhook);
webhooks.route("/twilio", twilioWebhook);
webhooks.route("/alexa", alexaWebhook);
webhooks.route("/gmail", gmailWebhook);

export { webhooks as webhooksRouters };
