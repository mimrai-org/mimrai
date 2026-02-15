import { createMCPClient, type MCPClientConfig } from "@ai-sdk/mcp";
import type { UserIntegrationInfo } from "@api/ai/types";
import {
	getMcpServers,
	getMcpServerUserTokens,
} from "@mimir/db/queries/mcp-servers";
import type { McpServerConfig } from "@mimir/db/schema";
import type { IntegrationName } from "@mimir/integration/registry";
import type { Tool } from "ai";
import { getUserAvailableIntegrations } from "../agents/agent-factory";
import { resolveValidMcpToken } from "../utils/mcp-token-refresh";
import { addTaskAttachmentTool } from "./add-task-attachment";
import {
	bumpAgentMemoryRelevanceTool,
	recallAgentMemoriesTool,
	saveAgentMemoryTool,
	updateAgentMemoryTool,
} from "./agent-memory";
// Integration tools
import { createAgentTool } from "./create-agent";
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
import { getAgentsTool } from "./get-agents";
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
import { getTaskAttachmentContentTool } from "./get-task-attachment-content";
import { getTaskByIdTool } from "./get-task-by-id";
import { getTasksTool } from "./get-tasks";
import { getUsersTool } from "./get-users";
import { sendDraftEmailTool } from "./send-draft-email";
import { updateCalendarEventTool } from "./update-calendar-event";
import { updateChecklistItemTool } from "./update-checklist-item";
import { updateMilestoneTool } from "./update-milestone";
import { updateProjectTool } from "./update-project";
import { updateTaskTool } from "./update-task";
import { switchToolboxTool } from "./use-toolbox";
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
	getTaskAttachment: getTaskAttachmentContentTool,

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

	// Toolbox
	switchToolbox: switchToolboxTool,

	// Agents
	createAgent: createAgentTool,
	getAgents: getAgentsTool,
} as const;

/**
 * Search and research tools
 */
export const researchTools = {
	webSearch: webSearchTool,
} as const;

export const memoryTools = {
	saveAgentMemory: saveAgentMemoryTool,
	recallAgentMemories: recallAgentMemoriesTool,
	updateAgentMemory: updateAgentMemoryTool,
	bumpAgentMemoryRelevance: bumpAgentMemoryRelevanceTool,
} as const;

/**
 * Integration tool registry - tools are added here when integrations are available
 * This allows agents to dynamically gain capabilities based on team configuration
 */
export const integrationToolRegistry = {
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

const integrationMcpBuilder: Partial<
	Record<IntegrationName, (integration: UserIntegrationInfo) => MCPClientConfig>
> = {
	github: (integration: UserIntegrationInfo) => ({
		transport: {
			type: "http",
			url: "https://api.githubcopilot.com/mcp/",
			headers: {
				Authorization: `Bearer ${integration.accessToken}`,
				"X-MCP-Toolsets": "copilot,repos,issues,pull_requests",
			},
		},
		name: "github-copilot",
	}),
};

/**
 * Get integration tools based on enabled integrations
 */
export const getIntegrationTools = async (
	enabledIntegrations?: UserIntegrationInfo[],
): Promise<{
	tools: Record<string, Tool>;
	toolboxes: Record<string, Record<string, Tool>>;
}> => {
	const tools: Record<string, Tool> = {};
	const toolboxes: Record<string, Record<string, Tool>> = {};

	if (enabledIntegrations) {
		for (const integration of enabledIntegrations) {
			const intTools =
				integrationToolRegistry[
					integration.type as keyof typeof integrationToolRegistry
				];
			if (intTools) {
				Object.assign(tools, intTools);
				toolboxes[integration.type] = intTools;
			}

			const mcpConfig = integrationMcpBuilder[integration.type];
			if (mcpConfig) {
				const mcpClient = await createMCPClient(mcpConfig(integration));
				const mcpTools = await mcpClient.tools();
				Object.assign(tools, mcpTools);
				toolboxes[integration.type] = {
					...toolboxes[integration.type],
					...mcpTools,
				};
			}
		}
	}

	return { tools, toolboxes };
};

/**
 * Get tools from team-configured MCP servers.
 * If userId is provided, per-user OAuth tokens are injected into MCP client headers.
 * Expired tokens are automatically refreshed when a refresh token is available.
 */
export const getTeamMcpTools = async (
	teamId: string,
	userId?: string,
): Promise<{
	tools: Record<string, Tool>;
	toolboxes: Record<string, Record<string, Tool>>;
}> => {
	const tools: Record<string, Tool> = {};
	const toolboxes: Record<string, Record<string, Tool>> = {};

	const mcpServerConfigs = await getMcpServers({ teamId, activeOnly: true });
	console.log(
		`Found ${mcpServerConfigs.length} MCP servers for team ${teamId}`,
	);

	// Look up per-user auth tokens for MCP servers that may require authentication
	const serverIds = mcpServerConfigs.map((s) => s.id);
	const userTokens =
		userId && serverIds.length > 0
			? await getMcpServerUserTokens({ userId, mcpServerIds: serverIds })
			: {};

	for (const server of mcpServerConfigs) {
		try {
			const config = server.config as McpServerConfig;
			const tokenInfo = userTokens[server.id];

			// Resolve a valid access token, refreshing if expired
			let accessToken: string | null = null;
			if (tokenInfo && userId) {
				accessToken = await resolveValidMcpToken({
					userId,
					mcpServerId: server.id,
					serverConfig: config,
					tokenInfo,
				});
			}

			// Merge static headers with per-user auth token if available
			const headers: Record<string, string> = {
				...config.headers,
				...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
			};

			const mcpClient = await createMCPClient({
				transport: {
					type: server.transport as "http" | "sse",
					url: config.url,
					headers: Object.keys(headers).length > 0 ? headers : undefined,
				},
				name: `mcp-${server.name}`,
			});
			const mcpTools = await mcpClient.tools();
			Object.assign(tools, mcpTools);
			toolboxes[`mcp:${server.name}`] = mcpTools;
		} catch (error) {
			console.error(
				`Failed to load MCP server "${server.name}" (${server.id}):`,
				error,
			);
		}
	}

	return { tools, toolboxes };
};

export const getAllTools = async (
	enabledIntegrations?: UserIntegrationInfo[],
	teamId?: string,
	userId?: string,
) => {
	const { tools: integrationTools, toolboxes: integrationToolboxes } =
		await getIntegrationTools(enabledIntegrations);

	let mcpTools: Record<string, Tool> = {};
	let mcpToolboxes: Record<string, Record<string, Tool>> = {};
	if (teamId) {
		const teamMcp = await getTeamMcpTools(teamId, userId);
		mcpTools = teamMcp.tools;
		mcpToolboxes = teamMcp.toolboxes;
	}

	return {
		tools: {
			...taskManagementTools,
			...researchTools,
			...memoryTools,
			...integrationTools,
			...mcpTools,
		},
		toolboxes: {
			...integrationToolboxes,
			...mcpToolboxes,
			taskManagement: taskManagementTools,
			research: researchTools,
			memory: memoryTools,
		},
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
	return await getIntegrationTools(userIntegrations);
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
	return await getAllTools(userIntegrations, teamId, userId);
};

// ── Data part types for streaming UI messages ──

export type MessageDataParts = {
	title: {
		title: string;
	};
	task: {
		id: string;
		title: string;
		description?: string;
		sequence?: number;
		statusId: string;
		assignee?: string;
		dueDate?: string;
	};
	"email-draft": {
		subject: string;
		body: string;
		recipient: string;
	};
	email: {
		id: string;
		from: string;
		to: string;
		subject: string;
		date: string;
		snippet: string;
		body: string;
		mimeType: string;
		labelIds?: string[];
		threadId: string;
	};
};

// ── Tool metadata for title generation and UI display ──

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
	getEmails: {
		name: "getEmails",
		title: "Get Emails",
		description: "Retrieve emails from Gmail with filtering",
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
