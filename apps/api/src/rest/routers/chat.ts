import { buildAppContext } from "@api/ai/agents/config/shared";
import { triageAgent } from "@api/ai/agents/triage";
import { formatLLMContextItems } from "@api/ai/utils/format-context-items";
import { getUserContext } from "@api/ai/utils/get-user-context";
import type { Context } from "@api/rest/types";
import { chatRequestSchema } from "@api/schemas/chat";
import { OpenAPIHono } from "@hono/zod-openapi";
import { smoothStream } from "ai";
import { withPlanFeatures } from "../middleware/plan-feature";

const app = new OpenAPIHono<Context>();

app.post("/", withPlanFeatures(["ai"]), async (c) => {
	const body = await c.req.json();
	const validationresult = chatRequestSchema.safeParse(body);

	if (!validationresult.success) {
		return c.json({ success: false, error: validationresult.error }, 400);
	}

	const {
		message,
		id,
		country,
		contextItems,
		agentChoice,
		toolChoice,
		timezone,
		city,
	} = validationresult.data;
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

	// If there are context items, add them to the message parts
	if (contextItems?.length) {
		message.parts = [
			{
				type: "text",
				text: `[HIDDEN] With: ${formatLLMContextItems(contextItems)}`,
			},
			...(message.parts || []),
		];
	}

	const appContext = buildAppContext(
		{
			...userContext,
			artifactSupport: true,
			integrationType: "web",
			// contextItems,
		},
		id,
	);

	return triageAgent.toUIMessageStream({
		message,
		strategy: "auto",
		maxRounds: 5,
		maxSteps: 20,
		context: appContext,
		agentChoice,
		toolChoice,
		experimental_transform: smoothStream({
			chunking: "word",
		}),
		sendSources: true,
	});
});

export { app as chatRouter };
