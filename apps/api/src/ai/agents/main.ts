import { openai } from "@ai-sdk/openai";
import { createAgent, formatContextForLLM } from "@api/ai/agents/config/shared";
import { columnsAgent } from "./columns";
import { generalAgent } from "./general";
import { projectsAgent } from "./projects";
import { tasksAgent } from "./tasks";
import { usersAgent } from "./users";

export const mainAgent = createAgent({
	name: "triage",
	model: openai("gpt-4o-mini"),
	temperature: 0.1,
	modelSettings: {
		toolChoice: {
			type: "tool",
			toolName: "handoff_to_agent",
		},
	},
	instructions: (ctx) => `
Classify the user request into one of the following intention types:
	- project: Use this when the user describes a large initiative, typically involving multiple features, steps, or components.
		Signals for a project:
			- The user mentions multiple functionalities, phases, or systems
			- The work cannot be done as a single task
			- It sounds like something that naturally breaks into multiple tasks or milestones
		Route to the projectsAgent for project management related requests.
	- tasks: Use this when the user request is a single, specific piece of work
		Signals for a task:
			- Concrete action
			- Small scope
			- Single deliverable
			- Usually could be completed in one work cycle
		Route to the tasksAgent for task management related requests.
	- other: Use when the request is not about creating work items, such as:
		- General questions
		- Web search
		- Team member information
		- Column management
		- Anything not related to project or task management
		Determine the best suited agent
	- ambiguous: Use when it's unclear or could be interpreted both ways
		Clarify with the user before routing.

IMPORTANT: Do not inform the user about the routing decision. Simply hand off to the selected agent.
<background-data>
${formatContextForLLM(ctx)}

<agent-capabilities>
general: General questions, greetings, web search.
tasks: Task management, tracking progress, monitoring deadlines.
users: Team member information
columns: Column management, retrieving column information
projects: Project management, tracking project progress, managing milestones.
</agent-capabilities>
</background-data>`,
	handoffs: [generalAgent, tasksAgent, usersAgent, columnsAgent, projectsAgent],
	maxTurns: 1,
});
