import { OpenAPIHono } from "@hono/zod-openapi";
import { githubWebhook } from "./github";
import { stripeWebhook } from "./stripe";

const webhooks = new OpenAPIHono();

webhooks.route("/stripe", stripeWebhook);
webhooks.route("/github", githubWebhook);

export { webhooks as webhooksRouters };
