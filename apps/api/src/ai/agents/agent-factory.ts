import { gateway } from "@ai-sdk/gateway";
import { getAgentById } from "@mimir/db/queries/agents";
import { getLinkedUsers } from "@mimir/db/queries/integrations";
import type { IntegrationName } from "@mimir/integration/registry";
import { AGENT_DEFAULT_MODEL } from "@mimir/utils/agents";
import type { Tool } from "ai";
import {
	integrationToolRegistry,
	researchTools,
	taskManagementTools,
} from "../tools/tool-registry";
import { type AgentConfig, createAgent } from "./config/agent";
import type { AppContext } from "./config/shared";

/**
 * User integration info returned from getUserIntegrations
 */
export interface UserIntegrationInfo {
	type: IntegrationName;
	name: string;
	integrationId: string;
	userLinkId: string;
}

/**
 * Get all integrations available to a user (where they have linked their account)
 */
export const getUserAvailableIntegrations = async ({
	userId,
	teamId,
}: {
	userId: string;
	teamId: string;
}): Promise<UserIntegrationInfo[]> => {
	const linkedUsers = await getLinkedUsers({
		userId,
		teamId,
	});

	return linkedUsers.data.map((link) => ({
		type: link.type as IntegrationName,
		name: link.name,
		integrationId: link.integrationId,
		userLinkId: link.id,
	}));
};

/**
 * Get enabled integrations that have tools registered
 */
export const getEnabledIntegrationTypes = (
	userIntegrations: UserIntegrationInfo[],
): IntegrationName[] => {
	return userIntegrations
		.map((i) => i.type)
		.filter((type) => integrationToolRegistry[type] !== undefined);
};

export const getCapabilities = ({ tools }: { tools: Record<string, Tool> }) => {
	const capabilities = Object.keys(tools).map((toolName) => {
		const tool = tools[toolName];
		return {
			tool: toolName,
			description: tool.description || "None",
		};
	});
	return capabilities;
};

export const getCapabilitiesPrompt = ({
	tools,
}: {
	tools: Record<string, Tool>;
}) => {
	const capabilities = getCapabilities({ tools });
	return capabilities
		.map((cap) => `- ${cap.tool}: ${cap.description}`)
		.join("\n");
};

export const createAgentFromDB = async ({
	agentId,
	teamId,
	config,
}: {
	agentId?: string;
	teamId: string;
	config: Partial<AgentConfig>;
}) => {
	let dbConfig: AgentConfig = {
		name: "MIMIR",
		description: "Your AI assistant.",
		model: gateway(AGENT_DEFAULT_MODEL),
	};

	// Fetch agent configuration from database
	const agent = await getAgentById({ id: agentId, teamId });
	if (agent) {
		if (!agent.isActive) {
			throw new Error(`Agent ${agent.name} is not active`);
		}

		dbConfig = {
			name: agent.name,
			description: agent.description || "",
			model: gateway(agent.model || AGENT_DEFAULT_MODEL),
		};
	}

	// Create agent configuration from database values
	const agentConfig = {
		...dbConfig,
		...config,
		buildInstructions: (ctx: AppContext) => {
			const soul = agent?.soul || "You are a helpful AI assistant.";
			const systemPrompt = config.buildInstructions?.(ctx) ?? "";

			return `
<soul>
This is your soul definition, use it to guide your behavior and responses:
${soul}
</soul>
			
${systemPrompt}
			`;
		},
	};

	return createAgent(agentConfig);
};
