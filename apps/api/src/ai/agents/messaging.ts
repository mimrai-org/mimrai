import { openai } from "@ai-sdk/openai";
import type { UIChatMessage } from "@api/ai/types";
import { db } from "@mimir/db/client";
import {
	getChatById,
	saveChat,
	saveChatMessage,
} from "@mimir/db/queries/chats";
import { getProjects } from "@mimir/db/queries/projects";
import { createTask, getTasks } from "@mimir/db/queries/tasks";
import { getMembers } from "@mimir/db/queries/teams";
import { statuses, statusTypeEnum } from "@mimir/db/schema";
import { trackTaskCreated } from "@mimir/events/server";
import { getTaskPermalink } from "@mimir/utils/tasks";
import { convertToModelMessages, generateText, stepCountIs, tool } from "ai";
import { eq } from "drizzle-orm";
import z from "zod";
import { createAgent } from "./config/agent";
import type { AppContext } from "./config/shared";

/**
 * Truncate messages while ensuring tool call/result pairs are not split
 * This prevents incomplete tool invocations that would confuse the model
 */
function truncateMessages(
	messages: UIChatMessage[],
	maxMessages = 20,
): UIChatMessage[] {
	if (messages.length <= maxMessages) {
		return messages;
	}

	// Start from the end and work backwards to find a safe truncation point
	const truncated = messages.slice(-maxMessages);

	// Check if first message has incomplete tool invocations
	const firstMsg = truncated[0];
	if (firstMsg?.role === "assistant" && firstMsg.parts) {
		const hasIncompleteToolCall = firstMsg.parts.some((part) => {
			if (part.type === "tool-invocation") {
				const toolPart = part as { state?: string };
				// If tool call is not in "result" state, it's incomplete
				return toolPart.state !== "result";
			}
			return false;
		});

		// If first message has incomplete tool calls, skip it to avoid confusion
		if (hasIncompleteToolCall) {
			return truncated.slice(1);
		}
	}

	return truncated;
}

/**
 * Messaging Agent - Optimized for chat integrations (Mattermost, WhatsApp, Slack)
 *
 * This agent is designed to:
 * - Handle direct messages from chat applications
 * - Provide structured, concise responses
 * - Perform limited actions: find tasks, create tasks
 * - Always resolve real IDs before mutations
 */

const findProjectsSchema = z.object({
	search: z
		.string()
		.optional()
		.describe("Project name or partial name to search for"),
});

const findProjectsTool = tool({
	description:
		"Search for projects by name. Use this FIRST to get a valid project ID before creating tasks.",
	inputSchema: findProjectsSchema,
	execute: async (input, executionOptions) => {
		const { teamId } = executionOptions.experimental_context as AppContext;
		const result = await getProjects({
			teamId,
			search: input.search,
			pageSize: 10,
		});
		return result.data.map((p) => ({
			id: p.id,
			name: p.name,
			description: p.description,
		}));
	},
});

const findStatusesSchema = z.object({});

const findStatusesTool = tool({
	description:
		"Get available task statuses. Use this FIRST to get a valid status ID before creating tasks.",
	inputSchema: findStatusesSchema,
	execute: async (_input, executionOptions) => {
		const { teamId } = executionOptions.experimental_context as AppContext;
		const data = await db
			.select({ id: statuses.id, name: statuses.name, type: statuses.type })
			.from(statuses)
			.where(eq(statuses.teamId, teamId));
		return data;
	},
});

const findUsersSchema = z.object({
	search: z
		.string()
		.optional()
		.describe("User name or partial name to search for"),
});

const findUsersTool = tool({
	description:
		"Search for team members by name. Use this to get a valid user ID for task assignment.",
	inputSchema: findUsersSchema,
	execute: async (input, executionOptions) => {
		const { teamId } = executionOptions.experimental_context as AppContext;
		const result = await getMembers({ teamId, search: input.search });
		return result.map((u) => ({
			id: u.id,
			name: u.name,
			email: u.email,
		}));
	},
});

const findTasksSchema = z.object({
	search: z.string().optional().describe("Task title or keyword to search"),
	assigneeId: z
		.array(z.string())
		.optional()
		.describe("Filter by assignee IDs (UUIDs)"),
	statusType: z
		.array(z.enum(statusTypeEnum.enumValues))
		.optional()
		.describe("Filter by status type"),
	pageSize: z.number().min(1).max(20).default(5).describe("Number of results"),
});

const findTasksTool = tool({
	description:
		"Search for tasks. Use to find existing tasks by title, assignee, or status.",
	inputSchema: findTasksSchema,
	execute: async (input, executionOptions) => {
		const { teamId } = executionOptions.experimental_context as AppContext;
		const result = await getTasks({
			teamId,
			search: input.search,
			assigneeId: input.assigneeId,
			statusType: input.statusType,
			view: "list",
			pageSize: input.pageSize,
		});
		return result.data.map((t) => ({
			id: t.id,
			title: t.title,
			status: t.status?.name,
			priority: t.priority,
			assignee: t.assignee?.name,
			dueDate: t.dueDate,
			url: getTaskPermalink(t.permalinkId),
		}));
	},
});

const createTaskSchema = z.object({
	title: z.string().min(1).describe("Task title - be concise but clear"),
	description: z.string().optional().describe("Task description"),
	projectId: z
		.string()
		.uuid()
		.describe("Project ID - MUST be a valid UUID from findProjects"),
	statusId: z
		.string()
		.uuid()
		.describe("Status ID - MUST be a valid UUID from findStatuses"),
	assigneeId: z
		.string()
		.uuid()
		.optional()
		.describe("Assignee ID - MUST be a valid UUID from findUsers"),
	priority: z
		.enum(["low", "medium", "high", "urgent"])
		.default("medium")
		.describe("Task priority"),
	dueDate: z.string().optional().describe("Due date in ISO format"),
});

const createTaskMessagingTool = tool({
	description: `Create a new task. IMPORTANT: You MUST first use findProjects and findStatuses to get valid IDs.
Never guess or make up IDs - always retrieve them from the system first.`,
	inputSchema: createTaskSchema,
	execute: async (input, executionOptions) => {
		const { userId, teamId, teamName } =
			executionOptions.experimental_context as AppContext;

		const newTask = await createTask({
			title: input.title,
			description: input.description,
			projectId: input.projectId,
			statusId: input.statusId,
			assigneeId: input.assigneeId,
			priority: input.priority,
			dueDate: input.dueDate
				? new Date(input.dueDate).toISOString()
				: undefined,
			teamId,
			userId,
			attachments: [],
			labels: [],
		});

		trackTaskCreated({
			userId,
			teamId,
			teamName,
			source: "messaging-agent",
		});

		return {
			success: true,
			task: {
				id: newTask.id,
				title: newTask.title,
				url: getTaskPermalink(newTask.permalinkId),
			},
		};
	},
});

const messagingTools = {
	findProjects: findProjectsTool,
	findStatuses: findStatusesTool,
	findUsers: findUsersTool,
	findTasks: findTasksTool,
	createTask: createTaskMessagingTool,
};

const buildSystemPrompt = (
	ctx: AppContext,
) => `You are a concise task assistant for "${ctx.teamName}" responding via ${ctx.integrationType}.

<context>
User: ${ctx.fullName} (ID: ${ctx.userId})
Team: ${ctx.teamName}
Timezone: ${ctx.timezone}
Current time: ${ctx.currentDateTime}
</context>

<critical-rules>
1. ALWAYS use tools to get real data - NEVER make up IDs or names
2. Before creating a task, you MUST:
  - Call findProjects to get the available projects, always select the most relevant project
  - Call findStatuses to get a valid statusId
  - Optionally call findUsers if assignment is needed
3. Keep responses SHORT - max 3-4 sentences
4. Use bullet points for lists, max 5 items
5. Include task URLs when relevant
6. Never expose raw UUIDs to the user
7. Write in the user's language (locale: ${ctx.locale})
</critical-rules>

<response-format>
For task creation:
✅ Created: "[title]"
📁 Project: [project name]
🔗 [task url]

For task search:
Found [n] tasks:
• [title] - [status] - [url]

For errors:
❗️ [brief error explanation]
</response-format>

<capabilities>
- Find tasks by title, assignee, or status
- Create new tasks (with proper project/status lookup)
- List projects and team members
</capabilities>`;

export const messagingAgent = createAgent({
	name: "Messaging Agent",
	description:
		"Agent optimized for chat applications to assist with task management.",
	tools: messagingTools,
	model: openai("gpt-4o-mini"),
});
