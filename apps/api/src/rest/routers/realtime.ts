import { OpenAPIHono } from "@hono/zod-openapi";
import { realtime } from "@mimir/realtime";
import { handle } from "@upstash/realtime";
import type { Context } from "../types";

const app = new OpenAPIHono<Context>();

app.get(async (c) => {
	const response = await handle({
		realtime,
	})(c.req.raw);

	return response;
});

export { app as realtimeRouter };
