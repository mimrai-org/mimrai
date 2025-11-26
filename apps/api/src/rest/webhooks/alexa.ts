import { OpenAPIHono } from "@hono/zod-openapi";
import type { Context } from "../types";

const app = new OpenAPIHono<Context>();

app.post("/alexa", async (c) => {
	console.log("Received Alexa webhook:", await c.req.json());
	return c.json({ message: "Alexa webhook received" });
});

export { app as alexaWebhook };
