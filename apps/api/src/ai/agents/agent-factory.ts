import { getLinkedUsers } from "@mimir/db/queries/integrations";
import type { IntegrationName } from "@mimir/integration/registry";
import type { Tool } from "ai";
import { integrationToolRegistry } from "../tools/tool-registry";

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
