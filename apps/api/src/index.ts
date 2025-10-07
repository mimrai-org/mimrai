import "dotenv/config";
import "./lib/instrument";
import { trpcServer } from "@hono/trpc-server";
import { OpenAPIHono } from "@hono/zod-openapi";
import { initIntegrations } from "@mimir/integration/init";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { auth } from "./lib/auth";
import { createContext } from "./lib/context";
import { routers } from "./rest/routers";
import type { Context } from "./rest/types";
import { webhooksRouters } from "./rest/webhooks";
import { appRouter } from "./trpc/routers/index";

const app = new OpenAPIHono<Context>();

console.log(process.env.ALLOWED_API_ORIGINS);

app.use(logger());
app.use(secureHeaders());
app.use(
	"*",
	cors({
		origin: process.env.ALLOWED_API_ORIGINS?.split(",") ?? [],
		allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
		allowHeaders: [
			"Authorization",
			"Content-Type",
			"accept-language",
			"user-agent",
			"x-team-id",
			"x-user-locale",
			"x-user-timezone",
			"x-user-country",
		],
		exposeHeaders: ["Content-Length"],
		credentials: true,
		maxAge: 86400,
	}),
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.use(
	"/trpc/*",
	trpcServer({
		router: appRouter,
		createContext: (_opts, context) => {
			return createContext({ context });
		},
	}),
);

app.route("/api", routers);
app.route("/webhooks", webhooksRouters);

initIntegrations()
	.catch((err) => {
		console.error("Error initializing integrations:", err);
		process.exit(1);
	})
	.then(() => {
		console.log("All integrations initialized");
	});

export default {
	port: process.env.PORT ? Number(process.env.PORT) : 3003,
	fetch: app.fetch,
	idleTimeout: 60,
	host: "::",
};
