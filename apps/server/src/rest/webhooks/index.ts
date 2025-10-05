import { OpenAPIHono } from "@hono/zod-openapi";
import { polarWebhook } from "./polar";

const webhooks = new OpenAPIHono();

webhooks.route("/polar", polarWebhook);

export { webhooks as webhooksRouters };
