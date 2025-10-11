import { OpenAPIHono } from "@hono/zod-openapi";
import { githubWebhook } from "./github";

// import { polarWebhook } from "./polar";

const webhooks = new OpenAPIHono();

// webhooks.route("/polar", polarWebhook);
webhooks.route("/github", githubWebhook);

export { webhooks as webhooksRouters };
