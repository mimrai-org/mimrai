import type { IntegrationName } from "@mimir/integration/registry";
import {
	getEnabledIntegrationTypes,
	getUserAvailableIntegrations,
} from "../agents/agent-factory";
import { addTaskAttachmentTool } from "./add-task-attachment";
// Integration tools
import { createCalendarEventTool } from "./create-calendar-event";
// Assistant job tools
// Checklist/subtask tools
import { createChecklistItemTool } from "./create-checklist-item";
import { createDraftEmailTool } from "./create-draft-email";
import { createLabelTool } from "./create-label";
import { createMilestoneTool } from "./create-milestone";
import { createProjectTool } from "./create-project";
// Task management tools
import { createTaskTool } from "./create-task";
import { createTaskCommentTool } from "./create-task-comment";
import { deleteCalendarEventTool } from "./delete-calendar-event";
import { getCalendarEventsTool } from "./get-calendar-events";
import { getChecklistItemsTool } from "./get-checklist-item";
import { getEmailsTool } from "./get-emails";
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
import { updateCalendarEventTool } from "./update-calendar-event";
import { updateChecklistItemTool } from "./update-checklist-item";
import { updateMilestoneTool } from "./update-milestone";
import { updateProjectTool } from "./update-project";
import { updateTaskTool } from "./update-task";
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
	addTaskAttachment: addTaskAttachmentTool,

	// Task comments
	createTaskComment: createTaskCommentTool,

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

export const memoryTools = {} as const;

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
		getEmails: getEmailsTool,
	},
	"google-calendar": {
		createCalendarEvent: createCalendarEventTool,
		updateCalendarEvent: updateCalendarEventTool,
		deleteCalendarEvent: deleteCalendarEventTool,
		getCalendarEvents: getCalendarEventsTool,
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

export const formatAvaiableTools = (tools: Record<string, unknown>) => {
	return Object.keys(tools)
		.map((toolName) => `- ${toolName}`)
		.join("\n");
};

/**
 * Format tools with their descriptions for use in system prompts.
 * Extracts the description from each tool and formats it as a list.
 */
export const formatToolsWithDescriptions = (
	tools: Record<string, { description?: string }>,
): string => {
	return Object.entries(tools)
		.map(([name, t]) => {
			const description = t.description || "No description available";
			return `- ${name}: ${description}`;
		})
		.join("\n");
};

/**
 * Get a formatted list of all available tools with descriptions
 * for use in agent system prompts
 */
export const getFormattedToolsForPrompt = (
	enabledIntegrations?: IntegrationName[],
): string => {
	const allTools = getAllTools(enabledIntegrations);
	return formatToolsWithDescriptions(
		allTools as Record<string, { description?: string }>,
	);
};

/**
 * Get a lightweight list of tool names only (no descriptions)
 * for use in prompts that need minimal context about capabilities
 *
 * This saves significant tokens (~50 tokens vs ~700 tokens with descriptions)
 * when the AI only needs to know what tools exist, not their full descriptions.
 */
export const getToolNamesForPrompt = (
	enabledIntegrations?: IntegrationName[],
): string => {
	const allTools = getAllTools(enabledIntegrations);
	return Object.keys(allTools)
		.map((name) => `- ${name}`)
		.join("\n");
};

export const getIntegrationToolsForUser = async ({
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
	return getIntegrationTools(enabledIntegrations);
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
	createAssistantJob: {
		name: "createAssistantJob",
		title: "Schedule Job",
		description: "Schedule a job for the assistant to execute later",
		relatedTools: ["getAssistantJobs"],
	},
	getAssistantJobs: {
		name: "getAssistantJobs",
		title: "Get Scheduled Jobs",
		description: "Retrieve all scheduled assistant jobs",
	},
	updateAssistantJob: {
		name: "updateAssistantJob",
		title: "Update Job",
		description: "Update an existing scheduled job",
		relatedTools: ["getAssistantJobs"],
	},
	deleteAssistantJob: {
		name: "deleteAssistantJob",
		title: "Delete Job",
		description: "Delete a scheduled job",
		relatedTools: ["getAssistantJobs"],
	},
} as const;

export type ToolName = keyof typeof toolMetadata;
