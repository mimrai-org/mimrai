import { createAgentFromDB } from "@api/ai/agents/agent-factory";
import { type AppContext, buildAppContext } from "@api/ai/agents/config/shared";
import { buildWorkspaceSystemPrompt } from "@api/ai/agents/workspace-agent";
import {
	getIntegrationToolsForUser,
	researchTools,
	taskManagementTools,
} from "@api/ai/tools/tool-registry";
import { formatLLMContextItems } from "@api/ai/utils/format-context-items";
import { getUserContext } from "@api/ai/utils/get-user-context";
import type { Context } from "@api/rest/types";
import { chatRequestSchema } from "@api/schemas/chat";
import { OpenAPIHono } from "@hono/zod-openapi";
import { createTokenMeter } from "@mimir/billing";
import { getAgentById } from "@mimir/db/queries/agents";
import { getTeamById } from "@mimir/db/queries/teams";
import { AGENT_DEFAULT_MODEL } from "@mimir/utils/agents";
import { createUIMessageStreamResponse } from "ai";
import { withPlanFeatures } from "../middleware/plan-feature";

const app = new OpenAPIHono<Context>();

app.post("/", withPlanFeatures(["ai"]), async (c) => {
	const body = await c.req.json();
	const validationresult = chatRequestSchema.safeParse(body);

	if (!validationresult.success) {
		console.error("Chat request validation failed:", validationresult.error);
		return c.json({ success: false, error: validationresult.error }, 400);
	}

	const { message, id, country, contextItems, agentId, timezone, city } =
		validationresult.data;
	const session = c.get("session");
	const teamId = c.get("teamId");

	const userId = session.userId;

	const [userContext, integrationTools, agentConfig, team] = await Promise.all([
		getUserContext({
			userId,
			teamId,
			country,
			city,
			timezone,
		}),
		getIntegrationToolsForUser({
			userId,
			teamId,
		}),
		getAgentById({
			id: agentId!,
			teamId,
		}),
		getTeamById(teamId),
	]);

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

	const meter = createTokenMeter(team.customerId);

	// Use agent from database if agentId is provided, otherwise use default workspace agent
	const agent = await createAgentFromDB({
		agentId,
		teamId,
		config: {
			tools: {
				...taskManagementTools,
				...integrationTools,
				...researchTools,
			},
			buildInstructions: buildWorkspaceSystemPrompt as (
				ctx: AppContext,
			) => string,
			onFinish: async ({ response, usage }) => {
				meter({
					model: agentConfig?.model || AGENT_DEFAULT_MODEL,
					usage,
				});
			},
			generateTitle: true,
		},
	});

	const stream = await agent.stream({
		message,
		context: appContext,
	});

	return createUIMessageStreamResponse({
		stream,
	});
});

export { app as chatRouter };
