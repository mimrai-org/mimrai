import type { IntegrationName } from "@mimir/integration/registry";
import {
	getEnabledIntegrationTypes,
	getUserAvailableIntegrations,
} from "../agents/agent-factory";
// Checklist/subtask tools
import { createChecklistItemTool } from "./create-checklist-item";
// Integration tools
import { createDraftEmailTool } from "./create-draft-email";
import { createLabelTool } from "./create-label";
import { createMilestoneTool } from "./create-milestone";
import { createProjectTool } from "./create-project";
// Task management tools
import { createTaskTool } from "./create-task";
import { getChecklistItemsTool } from "./get-checklist-item";
import { getLabelsTool } from "./get-labels";
// Milestone tools
import { getMilestonesTool } from "./get-milestones";
// Project tools
import { getProjectsTool } from "./get-projects";
// Reference data tools
import { getStatusesTool } from "./get-statuses";
import { getTaskByIdTool } from "./get-task-by-id";
import { getTasksTool } from "./get-tasks";
import { getUsersTool } from "./get-users";
import { sendDraftEmailTool } from "./send-draft-email";
import { updateChecklistItemTool } from "./update-checklist-item";
import { updateMilestoneTool } from "./update-milestone";
import { updateProjectTool } from "./update-project";
import { updateTaskTool } from "./update-task";
// Web search
import { webSearchTool } from "./web-search";

/**
 * Core tools available to all agents for task management
 */
export const taskManagementTools = {
	// Task CRUD
	createTask: createTaskTool,
	updateTask: updateTaskTool,
	getTasks: getTasksTool,
	getTaskById: getTaskByIdTool,

	// Checklist/subtask management
	getChecklistItems: getChecklistItemsTool,
	createChecklistItem: createChecklistItemTool,
	updateChecklistItem: updateChecklistItemTool,

	// Reference data
	getStatuses: getStatusesTool,
	getUsers: getUsersTool,
	getLabels: getLabelsTool,
	createLabel: createLabelTool,

	// Projects
	getProjects: getProjectsTool,
	createProject: createProjectTool,
	updateProject: updateProjectTool,

	// Milestones
	getMilestones: getMilestonesTool,
	createMilestone: createMilestoneTool,
	updateMilestone: updateMilestoneTool,
} as const;

/**
 * Search and research tools
 */
export const researchTools = {
	webSearch: webSearchTool,
} as const;

/**
 * Integration tool registry - tools are added here when integrations are available
 * This allows agents to dynamically gain capabilities based on team configuration
 */
export const integrationToolRegistry: Partial<
	Record<IntegrationName, Record<string, unknown>>
> = {
	gmail: {
		createDraftEmail: createDraftEmailTool,
		sendDraftEmail: sendDraftEmailTool,
	},
	// Future integrations can be added here:
	// slack: { ... },
	// whatsapp: { ... },
	// github: { ... },
};

/**
 * Get integration tools based on enabled integrations
 */
export const getIntegrationTools = (
	enabledIntegrations?: IntegrationName[],
): Record<string, unknown> => {
	const tools: Record<string, unknown> = {};

	if (enabledIntegrations) {
		for (const integration of enabledIntegrations) {
			const intTools = integrationToolRegistry[integration];
			if (intTools) {
				Object.assign(tools, intTools);
			}
		}
	}

	return tools;
};

export const getAllTools = (enabledIntegrations?: IntegrationName[]) => {
	return {
		...taskManagementTools,
		...researchTools,
		...getIntegrationTools(enabledIntegrations),
	};
};

export const getAllToolsForUser = async ({
	userId,
	teamId,
}: {
	userId: string;
	teamId: string;
}) => {
	const userIntegrations = await getUserAvailableIntegrations({
		userId,
		teamId,
	});
	const enabledIntegrations = getEnabledIntegrationTypes(userIntegrations);
	return getAllTools(enabledIntegrations);
};

// Tool metadata for title generation and UI display
export const toolMetadata: Record<
	string,
	{ name: string; title: string; description: string; relatedTools?: string[] }
> = {
	createTask: {
		name: "createTask",
		title: "Create Task",
		description: "Create a new task in your board",
		relatedTools: ["getTasks", "getStatuses", "getUsers"],
	},
	getTasks: {
		name: "getTasks",
		title: "Get Tasks",
		description: "Retrieve tasks from your board",
		relatedTools: ["getStatuses"],
	},
	getStatuses: {
		name: "getStatuses",
		title: "Get Statuses",
		description: "Retrieve available statuses",
	},
	updateTask: {
		name: "updateTask",
		title: "Update Task",
		description: "Update an existing task in your board",
		relatedTools: ["getTasks", "getStatuses"],
	},
	getUsers: {
		name: "getUsers",
		title: "Get Users",
		description: "Retrieve users from your team",
	},
	webSearch: {
		name: "webSearch",
		title: "Web Search",
		description: "Search the web for current information",
	},
} as const;

export type ToolName = keyof typeof toolMetadata;
