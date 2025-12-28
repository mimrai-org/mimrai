import { openai } from "@ai-sdk/openai";
import {
	COMMON_AGENT_RULES,
	createAgent,
	formatContextForLLM,
} from "@api/ai/agents/config/shared";
import { getStatusesTool } from "../tools/get-statuses";

export const columnsAgent = createAgent({
	name: "columns",
	model: openai("gpt-4o-mini"),
	temperature: 0.3,
	instructions: (
		ctx,
	) => `You are a column management specialist for ${ctx.companyName}. Columns are used to organize tasks within projects.
Provide information about columns as needed.

<background-data>
${formatContextForLLM(ctx)}
</background-data>

${COMMON_AGENT_RULES}

<guidelines>
- For direct queries: lead with results, add context
</guidelines>`,
	tools: {
		getColumns: getStatusesTool,
	},
	maxTurns: 5,
});
