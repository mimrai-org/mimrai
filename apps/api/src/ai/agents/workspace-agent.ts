import { openai } from "@ai-sdk/openai";
import type { IntegrationName } from "@mimir/integration/registry";
import {
	getAllToolsForUser,
	researchTools,
	taskManagementTools,
} from "../tools/tool-registry";
import { type AgentConfig, createAgent } from "./config/agent";
import {
	type AppContext,
	COMMON_AGENT_RULES,
	formatContextForLLM,
} from "./config/shared";

/**
 * Workspace Agent - General purpose assistant for team workspace
 *
 * This agent is designed to:
 * - Help users manage tasks, projects, and milestones
 * - Answer questions about the team's work
 * - Perform web searches for external information
 * - Execute integration-based tools when available
 *
 * Integration tools are added dynamically based on installed integrations:
 * - Gmail: Send emails, create drafts
 * - WhatsApp: Send messages
 * - Slack: Send messages
 */

export interface WorkspaceContext extends AppContext {
	/** Available integrations for this team */
	availableIntegrations?: Array<{
		type: IntegrationName;
		name: string;
		integrationId: string;
		userLinkId: string;
	}>;
}

const buildSystemPrompt = (ctx: WorkspaceContext) => {
	const availableIntegrationsText =
		ctx.availableIntegrations && ctx.availableIntegrations.length > 0
			? ctx.availableIntegrations
					.map((i) => `- ${i.name} (${i.type})`)
					.join("\n")
			: "No integrations configured.";

	return `You are Mimir, an AI assistant for the "${ctx.teamName}" workspace.

${formatContextForLLM(ctx)}

<available-integrations>
${availableIntegrationsText}
</available-integrations>

${COMMON_AGENT_RULES}

<critical-rules>
- You help users manage their work: tasks, projects, milestones, and team collaboration
- Analyze the user's request to determine intent:
  - Task management: create, update, list, or find tasks
  - Project management: create, update, or view projects
  - Milestone tracking: create, update, or view milestones
  - Team questions: look up users, assignments, workload
  - External research: use web search for current information, news, prices
  - Communication: use available integration tools (email, messaging)
  - General questions: answer based on context or search for information
- ALWAYS use tools to get real data - NEVER make up IDs or information
- When creating or updating resources, first retrieve valid IDs using appropriate get tools
- Keep responses helpful, concise, and actionable
- Write in the user's language (locale: ${ctx.locale})
</critical-rules>

<tool-usage>
For task operations:
- Creating tasks: use getStatuses to get valid statusId, getUsers for assigneeId, getProjects for projectId
- Updating tasks: use getTasks or getTaskById to find the task first
- Listing tasks: use getTasks with appropriate filters

For project operations:
- Creating projects: provide name, description, and optional settings
- Listing projects: use getProjects to see all projects

For milestone operations:
- Creating milestones: use getProjects first to get valid projectId
- Listing milestones: use getMilestones with optional projectId filter

For labels:
- Use getLabels to see available labels and their IDs
- Use createLabel to create new labels

For web research:
- Use webSearch for current information, news, prices, or any external data

For integrations (when available):
- Gmail: Create drafts first, then send when confirmed
</tool-usage>

<response-format>
Provide clear, actionable responses:

For successful operations:
✓ [Action completed]: Brief description of what was done

For task listings:
Present tasks in a scannable format with key details

For questions:
Provide a direct, helpful answer

For errors or missing information:
Explain what's needed and suggest next steps
</response-format>`;
};

/**
 * Create a workspace agent with specific integration tools enabled
 */
export const createWorkspaceAgent = (config: Partial<AgentConfig>) => {
	return createAgent({
		name: "Workspace Assistant",
		description:
			"General purpose AI assistant for team workspace management, task handling, and collaboration.",
		buildInstructions: buildSystemPrompt as (ctx: AppContext) => string,

		model: openai("gpt-5-mini"),
		...config,
	});
};
