import {
	COMMON_AGENT_RULES,
	createAgent,
	formatContextForLLM,
} from "@api/ai/agents/config/shared";
import { getUsersTool } from "../tools/get-users";

export const usersAgent = createAgent({
	name: "users",
	model: "gpt-4o-mini",
	temperature: 0.3,
	instructions: (
		ctx,
	) => `You are a users specialist for ${ctx.companyName}. Your goal is to help with team members, get members info.

<background-data>
${formatContextForLLM(ctx)}
</background-data>

${COMMON_AGENT_RULES}`,
	tools: {
		getUsers: getUsersTool,
	},
	maxTurns: 5,
});
