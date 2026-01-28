import { OpenAPIHono } from "@hono/zod-openapi";
import { getApiUrl } from "@mimir/utils/envs";
import type { Context } from "../types";

const wellKnownRouter = new OpenAPIHono<Context>();

// MCP Server Metadata - simple discovery for API key authentication
wellKnownRouter.get("/mcp-server", (c) => {
	const serverUrl = getApiUrl();

	const metadata = {
		name: "mimrai-mcp-server",
		version: "1.0.0",
		mcp_endpoint: `${serverUrl}/mcp`,
		authentication: {
			type: "api_key",
			header: "x-api-key",
			description:
				"API key for MCP authentication. Create an API key in your Mimrai dashboard settings.",
		},
		capabilities: {
			tasks: ["read", "write"],
			projects: ["read", "write"],
			milestones: ["read", "write"],
			labels: ["read", "write"],
		},
	};

	return c.json(metadata, 200, {
		"Content-Type": "application/json",
		"Cache-Control":
			"public, max-age=15, stale-while-revalidate=15, stale-if-error=86400",
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Methods": "GET",
	});
});

export { wellKnownRouter };
