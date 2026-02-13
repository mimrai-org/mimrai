import type { UserIntegrationInfo } from "@api/ai/types";
import { getAgentById } from "@mimir/db/queries/agents";
import { getLinkedUsers } from "@mimir/db/queries/integrations";
import type { IntegrationName } from "@mimir/integration/registry";
import { AGENT_DEFAULT_MODEL } from "@mimir/utils/agents";
import type { Tool } from "ai";
import { integrationToolRegistry } from "../tools/tool-registry";
import { type AgentConfig, createAgent } from "./config/agent";
import type { AppContext } from "./config/shared";

export type { UserIntegrationInfo };

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
		accessToken: link.accessToken,
		config: link.config,
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
		.filter(
			(type) =>
				integrationToolRegistry[
					type as keyof typeof integrationToolRegistry
				] !== undefined,
		);
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

interface CreateAgentFromDBParams {
	agentId?: string;
	teamId: string;
	toolboxes?: Record<string, Record<string, unknown>>;
	defaultActiveToolboxes?: string[];
	defaultActiveTools?: string[];
	config: Partial<AgentConfig>;
}

const DEFAULT_AGENT_CONFIG: AgentConfig = {
	name: "MIMIR",
	description: "Your AI assistant.",
	model: AGENT_DEFAULT_MODEL,
};

/**
 * Loads agent config from the database (if an agentId is provided)
 * and falls back to a sensible default otherwise.
 */
async function resolveAgentConfig(agentId: string | undefined, teamId: string) {
	const agent = await getAgentById({ id: agentId, teamId });

	if (!agent) {
		return {
			dbConfig: DEFAULT_AGENT_CONFIG,
			agent: null,
			restrictedToolboxes: [] as string[],
		};
	}

	if (!agent.isActive) {
		throw new Error(`Agent ${agent.name} is not active`);
	}

	const dbConfig: AgentConfig = {
		name: agent.name,
		description: agent.description || "",
		model: agent.model || AGENT_DEFAULT_MODEL,
	};

	return {
		dbConfig,
		agent,
		restrictedToolboxes: agent.activeToolboxes ?? [],
	};
}

/**
 * Resolves which toolboxes are available for the agent to switch into.
 * Excludes toolboxes that are already active by default, and optionally
 * restricts the set to only those the agent is explicitly allowed to use.
 */
function resolveAvailableToolboxes(
	allToolboxes: Record<string, Record<string, unknown>> | undefined,
	defaultActiveToolboxes: string[] | undefined,
	restrictedToolboxes: string[],
): string[] {
	const allNames = Object.keys(allToolboxes ?? {});
	const defaultSet = new Set(defaultActiveToolboxes ?? []);

	let available = allNames.filter((tb) => !defaultSet.has(tb));

	if (restrictedToolboxes.length > 0) {
		const allowed = new Set(restrictedToolboxes);
		available = available.filter((tb) => allowed.has(tb));
	}

	return available;
}

/**
 * Builds the flat list of tool names that are active on every step
 * (before the agent switches into an optional toolbox).
 */
function buildDefaultActiveTools(
	defaultActiveTools: string[] | undefined,
	defaultActiveToolboxes: string[] | undefined,
	toolboxes: Record<string, Record<string, unknown>> | undefined,
): string[] {
	const tools = ["switchToolbox", ...(defaultActiveTools ?? [])];

	for (const tb of defaultActiveToolboxes ?? []) {
		tools.push(...Object.keys(toolboxes?.[tb] ?? {}));
	}

	return tools;
}

/**
 * Finds the last toolbox the agent switched into during the current run
 * and returns the name, or `undefined` if none was used.
 */
function getLastSwitchedToolbox(
	steps: Array<{ toolCalls: Array<{ toolName: string; input: unknown }> }>,
): string | undefined {
	const lastSwitch = steps
		.flatMap((s) => s.toolCalls)
		.filter((tc) => tc.toolName === "switchToolbox")
		.pop();

	return (lastSwitch?.input as { toolbox?: string })?.toolbox;
}

/**
 * Create an agent whose config, model, and personality ("soul") are
 * loaded from the database. Falls back to sensible defaults when no
 * agentId is provided or the agent record doesn't exist.
 */
export const createAgentFromDB = async ({
	agentId,
	teamId,
	toolboxes,
	defaultActiveToolboxes,
	defaultActiveTools,
	config,
}: CreateAgentFromDBParams) => {
	const { dbConfig, agent, restrictedToolboxes } = await resolveAgentConfig(
		agentId,
		teamId,
	);

	const availableToolboxes = resolveAvailableToolboxes(
		toolboxes,
		defaultActiveToolboxes,
		restrictedToolboxes,
	);

	const alwaysActiveTools = buildDefaultActiveTools(
		defaultActiveTools,
		defaultActiveToolboxes,
		toolboxes,
	);

	const agentConfig: AgentConfig = {
		...dbConfig,

		prepareStep: async ({ steps, ...rest }) => {
			const parentPrepareStep = config.prepareStep
				? await config.prepareStep({ steps, ...rest })
				: {};

			const switchedToolbox = getLastSwitchedToolbox(steps);

			if (switchedToolbox) {
				const toolboxTools = Object.keys(toolboxes?.[switchedToolbox] ?? {});
				return {
					activeTools: [...toolboxTools, ...alwaysActiveTools] as never[],
					...parentPrepareStep,
				};
			}

			return {
				activeTools: alwaysActiveTools as never[],
				...parentPrepareStep,
			};
		},

		// Spread caller-provided config (tools, stopWhen, callbacks, etc.)
		...config,

		// Always wrap buildInstructions so we can inject toolbox & soul context
		buildInstructions: (ctx: AppContext) => {
			const soul = agent?.soul ?? "You are a helpful AI assistant.";
			const callerPrompt = config.buildInstructions?.(ctx) ?? "";

			return `
<toolboxes>
IMPORTANT: Your capabilities might be limited, but you can gain access to more tools by using the switchToolbox tool. Available toolboxes are:
${availableToolboxes.map((tb) => `- ${tb}`).join("\n")}

Switching to a toolbox will grant you access to the tools within it, which can help you complete your tasks.
Example: calling switchToolbox with the {toolbox: "github"} object parameter will give you access to tools that let you interact with GitHub, such as listing pull requests, creating issues, etc.
</toolboxes>

<soul>
This is your soul definition, use it to guide your behavior and responses:
${soul}
</soul>

${callerPrompt}`;
		},
	};

	return createAgent(agentConfig);
};
