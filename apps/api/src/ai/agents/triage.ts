import { openai } from "@ai-sdk/openai";
import { createAgent, formatContextForLLM } from "@api/ai/agents/config/shared";
import { planningAgent } from "./planning";
import { projectsAgent } from "./projects";
import { tasksAgent } from "./tasks";

export const triageAgent = createAgent({
	name: "triage",
	model: openai("gpt-4o-mini"),
	modelSettings: {
		toolChoice: {
			type: "tool",
			toolName: "handoff_to_agent",
		},
	},
	instructions: (ctx) => `
Your job: route user requests to the appropriate specialist agent based on the request content.

Routing Guidelines:
- Analyze the user's request carefully.
- Determine which specialist agent is best suited to handle the request:
	- tasksAgent: for anything related to task management (creating, updating, querying tasks).
	- projectsAgent: for anything related to project management (creating, updating, querying projects).
	- planningAgent: for strategic planning, breaking down goals into tasks/projects, and prioritization.
- Consider the context provided to make an informed decision.
- If the request is ambiguous, or need clarification, prefer routing to the planningAgent for further analysis.

IMPORTANT: Do not inform the user about the routing decision. Simply hand off to the selected agent.

<background-data>
${formatContextForLLM(ctx)}
</background-data>`,
	handoffs: [tasksAgent, projectsAgent, planningAgent],
	maxTurns: 2,
});
