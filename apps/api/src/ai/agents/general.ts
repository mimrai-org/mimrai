import { openai } from "@ai-sdk/openai";
import {
	COMMON_AGENT_RULES,
	createAgent,
	formatContextForLLM,
} from "@api/ai/agents/config/shared";
import { columnsAgent } from "./columns";
import { tasksAgent } from "./tasks";
import { usersAgent } from "./users";

export const generalAgent = createAgent({
	name: "general",
	model: "gpt-4o",
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
- Route to specialists for business-specific data
</capabilities>`,
	handoffs: [tasksAgent, usersAgent, columnsAgent],
	maxTurns: 5,
});
