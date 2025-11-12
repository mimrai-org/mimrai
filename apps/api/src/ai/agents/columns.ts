import {
	COMMON_AGENT_RULES,
	createAgent,
	formatContextForLLM,
} from "@api/ai/agents/config/shared";
import { getColumnsTool } from "../tools/get-columns";

export const columnsAgent = createAgent({
	name: "columns",
	model: "gpt-4o-mini",
	temperature: 0.3,
	instructions: (
		ctx,
	) => `You are a column management specialist for ${ctx.companyName}. Your goal is to help manage columns, retrieve column information.

<background-data>
${formatContextForLLM(ctx)}
</background-data>

${COMMON_AGENT_RULES}`,
	tools: {
		getColumns: getColumnsTool,
	},
	maxTurns: 5,
});
