import { createAgent, formatContextForLLM } from "@api/ai/agents/config/shared";
import { columnsAgent } from "./columns";
import { generalAgent } from "./general";
import { tasksAgent } from "./tasks";
import { usersAgent } from "./users";

export const mainAgent = createAgent({
	name: "triage",
	model: "gpt-4o-mini",
	temperature: 0.1,
	modelSettings: {
		toolChoice: {
			type: "tool",
			toolName: "handoff_to_agent",
		},
	},
	instructions: (ctx) => `Route user requests to the appropriate specialist.

  IMPORTANT: Most of the time, users will send feature requests, bug reports, or to-do related messages. If that's the case, route to the tasks agent directly.

<background-data>
${formatContextForLLM(ctx)}

<agent-capabilities>
general: General questions, greetings
tasks: Task management, tracking progress, monitoring deadlines.
users: Team member information
columns: Column management, retrieving column information
</agent-capabilities>
</background-data>`,
	handoffs: [generalAgent, tasksAgent, usersAgent, columnsAgent],
	maxTurns: 1,
});
