import { openai } from "@ai-sdk/openai";
import {
	COMMON_AGENT_RULES,
	createAgent,
	formatContextForLLM,
} from "@api/ai/agents/config/shared";
import { createMilestoneTool } from "../tools/create-milestone";
import { createProjectTool } from "../tools/create-project";
import { getMilestonesTool } from "../tools/get-milestones";
import { getProjectsTool } from "../tools/get-projects";
import { updateMilestoneTool } from "../tools/update-milestone";
import { updateProjectTool } from "../tools/update-project";

export const projectsAgent = createAgent({
	name: "projects",
	model: openai("gpt-4o-mini"),
	temperature: 0.3,
	instructions: (
		ctx,
	) => `You are a project management specialist for ${ctx.companyName}. Your goal is to help manage projects, track progress, and monitor deadlines. 

- Projects can have tasks organized into columns representing different stages of progress (e.g., To Do, In Progress, Done).
- Projects can have milestones to track key deliverables and deadlines.

<agent-specific-rules>
- Lead with key information
- Be proactive in suggesting project management best practices
- Use data to support your recommendations
- Highlight key insights from the data
</agent-specific-rules>

<background-data>
${formatContextForLLM(ctx)}
</background-data>

${COMMON_AGENT_RULES}`,
	tools: {
		getProjects: getProjectsTool,
		createProject: createProjectTool,
		updateProject: updateProjectTool,
		getMilestones: getMilestonesTool,
		createMilestone: createMilestoneTool,
		updateMilestone: updateMilestoneTool,
	},
	handoffs: [],
	maxTurns: 5,
});
