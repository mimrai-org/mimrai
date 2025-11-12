import { buildAppContext } from "@api/ai/agents/config/shared";
import { mainAgent } from "@api/ai/agents/main";
import { getUserContext } from "@api/ai/utils/get-user-context";
import type { Context } from "@api/rest/types";
import { chatRequestSchema } from "@api/schemas/chat";
import { db } from "@db/index";
import { OpenAPIHono } from "@hono/zod-openapi";
import { smoothStream } from "ai";

const app = new OpenAPIHono<Context>();

const MAX_MESSAGES_IN_CONTEXT = 20;

app.post("/", async (c) => {
	const body = await c.req.json();
	const validationresult = chatRequestSchema.safeParse(body);

	if (!validationresult.success) {
		return c.json({ success: false, error: validationresult.error }, 400);
	}

	const { message, id, country, agentChoice, toolChoice, timezone, city } =
		validationresult.data;
	const session = c.get("session");
	const teamId = c.get("teamId");

	const userId = session.userId;

	const userContext = await getUserContext({
		userId,
		teamId,
		country,
		city,
		timezone,
	});

	const appContext = buildAppContext(
		{
			...userContext,
			artifactSupport: true,
		},
		id,
	);

	return mainAgent.toUIMessageStream({
		message,
		strategy: "auto",
		maxRounds: 5,
		maxSteps: 20,
		context: appContext,
		agentChoice,
		// toolChoice,
		experimental_transform: smoothStream({
			chunking: "word",
		}),
		sendSources: true,
	});
});

export { app as chatRouter };
