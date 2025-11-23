import { openai } from "@ai-sdk/openai";
import {
	COMMON_AGENT_RULES,
	createAgent,
	formatContextForLLM,
} from "@api/ai/agents/config/shared";
import { webSearchTool } from "../tools/web-search";
import { columnsAgent } from "./columns";
import { tasksAgent } from "./tasks";
import { usersAgent } from "./users";

export const generalAgent = createAgent({
	name: "general",
	model: openai("gpt-4o-mini"),
	temperature: 0.8,
	instructions: (
		ctx,
	) => `You are a helpful assistant for ${ctx.companyName}. Handle general questions.

<background-data>
${formatContextForLLM(ctx)}
</background-data>

${COMMON_AGENT_RULES}

<capabilities>
- Answer simple questions directly
- Use webSearch for current information, news, external data
- Route to specialists for business-specific data
</capabilities>`,
	tools: {
		webSearch: webSearchTool,
	},
	handoffs: [tasksAgent, usersAgent, columnsAgent],
	maxTurns: 5,
});
