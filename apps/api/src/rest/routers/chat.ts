import { createAgentFromDB } from "@api/ai/agents/agent-factory";
import { type AppContext, buildAppContext } from "@api/ai/agents/config/shared";
import { buildWorkspaceSystemPrompt } from "@api/ai/agents/workspace-agent";
import { getAllToolsForUser } from "@api/ai/tools/tool-registry";
import { formatLLMContextItems } from "@api/ai/utils/format-context-items";
import { getUserContext } from "@api/ai/utils/get-user-context";
import type { Context } from "@api/rest/types";
import { chatRequestSchema } from "@api/schemas/chat";
import { OpenAPIHono } from "@hono/zod-openapi";
import { calculateTokenUsageCost } from "@mimir/billing";
import { getAgentById, getDocumentsForAgent } from "@mimir/db/queries/agents";
import { recordCreditUsage } from "@mimir/db/queries/credits";
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

	const [userContext, allTools, agentConfig] = await Promise.all([
		getUserContext({
			userId,
			teamId,
			country,
			city,
			timezone,
		}),
		getAllToolsForUser({
			userId,
			teamId,
		}),
		getAgentById({
			id: agentId!,
			teamId,
		}),
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

	const documents = await getDocumentsForAgent({
		agentId: agentId!,
		teamId,
	});

	const appContext = buildAppContext(
		{
			...userContext,
			artifactSupport: true,
			integrationType: "web",
			documentsOfInterest: documents,
			agentId: agentId!,
			// contextItems,
		},
		id,
	);

	// Use agent from database if agentId is provided, otherwise use default workspace agent
	const agent = await createAgentFromDB({
		agentId,
		teamId,
		toolboxes: allTools.toolboxes,
		defaultActiveToolboxes: ["taskManagement", "research", "memory"],
		config: {
			tools: {
				...allTools.tools,
			},
			buildInstructions: buildWorkspaceSystemPrompt as (
				ctx: AppContext,
			) => string,
			onFinish: async ({ response, usage }) => {
				const usageCost = await calculateTokenUsageCost({
					model: agentConfig?.model || AGENT_DEFAULT_MODEL,
					usage,
				});

				const usageCostCents = Math.round((usageCost?.costUSD || 0) * 100);
				if (usageCostCents > 0) {
					await recordCreditUsage({
						teamId,
						amountCents: usageCostCents,
						metadata: {
							model:
								usageCost?.model || agentConfig?.model || AGENT_DEFAULT_MODEL,
							inputTokens: usage.inputTokens || 0,
							outputTokens: usage.outputTokens || 0,
							totalTokens: usage.totalTokens || 0,
							costUSD: usageCost?.costUSD || 0,
						},
					});
				}
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
