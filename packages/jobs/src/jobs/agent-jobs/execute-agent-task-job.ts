import {
	createAgentFromDB,
	getEnabledIntegrationTypes,
	getUserAvailableIntegrations,
} from "@api/ai/agents/agent-factory";
import { type AppContext, buildAppContext } from "@api/ai/agents/config/shared";
import {
	buildExecutorSystemPrompt,
	type TaskExecutorContext,
	updateTaskMemoryTool,
} from "@api/ai/agents/task-executor";
import { getAllTools } from "@api/ai/tools/tool-registry";
import type { UIChatMessage } from "@api/ai/types";
import { getUserContext } from "@api/ai/utils/get-user-context";
import { checkPlanFeatures, createTokenMeter } from "@mimir/billing";
import { getActivities } from "@mimir/db/queries/activities";
import { getAgentByUserId } from "@mimir/db/queries/agents";
import {
	getChatById,
	saveChat,
	saveChatMessage,
} from "@mimir/db/queries/chats";
import { getChecklistItems } from "@mimir/db/queries/checklists";
import {
	addTaskExecutionUsageMetrics,
	createTaskExecution,
	updateTaskExecution,
} from "@mimir/db/queries/task-executions";
import { createTaskComment, getTaskById } from "@mimir/db/queries/tasks";
import { getTeamById } from "@mimir/db/queries/teams";
import { getSystemUser } from "@mimir/db/queries/users";
import { AGENT_DEFAULT_MODEL } from "@mimir/utils/agents";
import { logger, schemaTask } from "@trigger.dev/sdk";
import { generateId, stepCountIs } from "ai";
import z from "zod";

/**
 * Job that executes an agent task plan using a unified agentic approach
 *
 * This job:
 * 1. Validates the execution state
 * 2. Executes the full plan in a single AI agentic loop (token-efficient)
 * 3. Handles human delegation via checklist items
 * 4. Posts progress comments
 * 5. Completes the task when done
 * 6. Supports focusing on a specific checklist item when checklistItemId is provided
 */
export const executeAgentTaskPlanJob = schemaTask({
	id: "execute-agent-task-plan",
	schema: z.object({
		taskId: z.string(),
		teamId: z.string(),
		/**
		 * Optional: Focus on a specific checklist item instead of the whole task
		 * When provided, the agent will focus on resolving this specific checklist item
		 */
		checklistItemId: z.string().optional(),
	}),
	maxDuration: 15 * 60, // 15 minutes
	run: async (payload) => {
		const { taskId, teamId, checklistItemId } = payload;
		logger.info("Starting agent plan execution", {
			taskId,
			checklistItemId,
		});

		const team = await getTeamById(teamId);
		if (!team) {
			logger.error("Team not found for agent task execution", { teamId });
			return { status: "failed", reason: "team_not_found" };
		}

		const task = await getTaskById(taskId);
		if (!task) {
			await updateTaskExecution({
				taskId: taskId,
				status: "failed",
				lastError: "Task not found",
			});
			return { status: "failed", reason: "task_not_found" };
		}

		// If focusing on a checklist item, find it and determine the agent to use
		let focusedChecklistItem:
			| {
					id: string;
					description: string;
					isCompleted: boolean;
					assigneeId?: string;
			  }
			| undefined;
		let agentUserId: string | null = null;

		if (checklistItemId) {
			// Get checklist items to find the focused one
			const checklistItems = await getChecklistItems({
				taskId,
				teamId,
			});
			const item = checklistItems.find((c) => c.id === checklistItemId);

			if (!item) {
				logger.error("Checklist item not found", { checklistItemId });
				return { status: "failed", reason: "checklist_item_not_found" };
			}

			if (!item.assigneeId) {
				logger.error("Checklist item has no assignee", { checklistItemId });
				return { status: "failed", reason: "checklist_item_no_assignee" };
			}

			focusedChecklistItem = {
				id: item.id,
				description: item.description,
				isCompleted: item.isCompleted,
				assigneeId: item.assigneeId ?? undefined,
			};
			agentUserId = item.assigneeId;

			logger.info("Focusing on checklist item", {
				checklistItemId,
				description: item.description,
				assigneeId: item.assigneeId,
			});
		} else {
			// Regular task execution - use task assignee
			if (!task.assigneeId) {
				await updateTaskExecution({
					taskId: taskId,
					status: "failed",
					lastError: "Task has no assignee",
				});
				return { status: "failed", reason: "task_no_assignee" };
			}
			agentUserId = task.assigneeId;
		}

		const agentConfig = await getAgentByUserId({
			userId: agentUserId,
			teamId,
		});

		const execution = await createTaskExecution({ taskId, teamId });

		// Build appropriate message based on focus mode
		const messageText = focusedChecklistItem
			? execution.status === "pending"
				? `You have been assigned to complete the following checklist item: "${focusedChecklistItem.description}". Please resolve this item.`
				: "Check the last user message and evaluate next steps based on the current checklist item state."
			: execution.status === "pending"
				? "Starting task execution."
				: "Check the last user message and evaluate next steps based on the current task state.";

		const message: UIChatMessage = {
			id: generateId(),
			role: "user",
			parts: [
				{
					type: "text",
					text: messageText,
				},
			],
		};

		const systemUser = await getSystemUser();
		if (!systemUser) {
			return { status: "failed", reason: "system_user_not_found" };
		}

		// Use the agent user ID (from checklist item or task assignee), fallback to system user
		const userId = agentConfig
			? agentConfig.userId
			: (agentUserId ?? systemUser.id);

		const canAccess = await checkPlanFeatures(teamId, ["ai"]);
		if (!canAccess) {
			logger.error("Team plan does not support AI features", { teamId });
			await createTaskComment({
				taskId,
				teamId,
				userId,
				comment:
					"Your current plan does not support AI features. Please upgrade to access this functionality.",
			});
			return { status: "failed", reason: "plan_cannot_access_ai_features" };
		}

		const userContext = await getUserContext({
			userId,
			teamId,
		});

		const activitiesResult = await getActivities({
			groupId: taskId,
			teamId,
			type: ["task_comment", "task_comment_reply"],
			pageSize: 20,
		});

		const activitiesAsMessages = activitiesResult.data.map((a) => ({
			id: a.id,
			message: {
				role: a.userId === userId ? "assistant" : "user",
				id: a.id,
				parts: [{ type: "text", text: a.metadata?.comment || "" }],
			} as UIChatMessage,
			userId: a.userId,
			createdAt: a.createdAt!,
		}));

		const chat = await getChatById(taskId, teamId);
		if (!chat) {
			await saveChat({
				chatId: taskId,
				teamId,
				userId,
			});
		}

		const unsavedMessages = activitiesAsMessages.filter(
			(a) => !chat?.messages.find((m) => m.id === a.id),
		);

		await Promise.all(
			unsavedMessages.map((m) =>
				saveChatMessage({
					chatId: taskId,
					teamId,
					message: m.message,
					userId: m.userId,
					role: m.message.role,
					createdAt: m.createdAt,
				}),
			),
		);

		// Get enabled integrations for the system user
		const userIntegrations = await getUserAvailableIntegrations({
			userId: agentConfig?.behalfUserId ?? task.createdBy,
			teamId,
		});
		const enabledIntegrations = getEnabledIntegrationTypes(userIntegrations);

		const executorContext: TaskExecutorContext = {
			...buildAppContext(
				{
					...userContext,
					integrationType: "web",
					behalfUserId: agentConfig?.behalfUserId ?? task.createdBy,
				},
				taskId,
			),
			task: {
				id: task.id,
				title: task.title,
				description: task.description ?? undefined,
				status: task.status?.name,
				statusId: task.statusId,
				priority: task.priority ?? undefined,
				assignee: task.assignee?.name ?? undefined,
				assigneeId: task.assigneeId ?? undefined,
				project: task.project?.name ?? undefined,
				projectId: task.projectId ?? undefined,
				milestone: task.milestone?.name ?? undefined,
				milestoneId: task.milestoneId ?? undefined,
				attachments: task.attachments ?? [],
				dueDate: task.dueDate ?? undefined,
				labels: task.labels ?? [],
				checklistItems: task.checklistSummary?.checklist ?? [],
			},
			activities: activitiesResult.data.map((a) => ({
				userId: a.userId ?? "",
				userName: a.user?.name ?? "Unknown",
				type: a.type,
				content: a.metadata?.comment,
				createdAt: a.createdAt ?? "",
			})),
			executionMemory: execution.memory ?? undefined,
			enabledIntegrations,
			// Focus mode: determines whether we're working on the whole task or a specific checklist item
			focusMode: focusedChecklistItem ? "checklist-item" : "task",
			focusedChecklistItem,
		};

		// 6. Update status to executing
		await updateTaskExecution({
			taskId: taskId,
			status: "executing",
		});

		try {
			const { tools: allTools, toolboxes } = await getAllTools(
				userIntegrations,
				teamId,
				agentConfig?.behalfUserId ?? agentConfig?.userId,
			);
			const tools = {
				updateTaskMemory: updateTaskMemoryTool,
				...allTools,
			};

			const meter = createTokenMeter(team.customerId!);

			const agent = await createAgentFromDB({
				agentId: agentConfig?.id,
				teamId,
				toolboxes,
				defaultActiveToolboxes: ["taskManagement", "research"],
				defaultActiveTools: ["updateTaskMemory"],
				config: {
					tools,
					experimental_context: executorContext,
					stopWhen: stepCountIs(50),
					buildInstructions: buildExecutorSystemPrompt as (
						ctx: AppContext,
					) => string,
					onStepFinish: async ({ toolCalls, toolResults }) => {
						for (const call of toolResults) {
							logger.info(`Tool: ${call.toolName}`, {
								toolName: call.toolName,
								input: call.input,
								output: call.output,
							});
						}
					},
					onFinish: async ({ usage, finishReason, response }) => {
						const meterResults = await meter({
							model: agentConfig?.model || AGENT_DEFAULT_MODEL,
							usage,
						});
						await addTaskExecutionUsageMetrics(task.id, {
							inputTokens: meterResults?.inputTokens || 0,
							outputTokens: meterResults?.outputTokens || 0,
							totalTokens: meterResults?.totalTokens || 0,
							costUSD: meterResults?.costUSD || 0,
						});
						logger.info("Agent OnFinish", { usage, finishReason });
					},
				},
			});

			logger.info("Executing task with agent", { taskId });
			const response = await agent.generate({
				context: executorContext,
				message: message,
			});
			logger.info("Agent execution completed", { taskId });

			// Find last text part in the response
			const textParts = response.parts.filter((p) => p.type === "text");
			const lastTextPart = textParts[textParts.length - 1]?.text || "";

			// Remove xmltags from the response if any
			const cleanedResponse = lastTextPart.replace(/<[^>]*>/g, "");
			await createTaskComment({
				taskId: taskId,
				userId: userId,
				teamId,
				comment: cleanedResponse,
			});

			await updateTaskExecution({
				taskId: taskId,
				status: "completed",
				completedAt: new Date(),
			});
		} catch (error) {
			logger.error("Unexpected error during plan execution", { error });
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";

			await updateTaskExecution({
				taskId: taskId,
				status: "failed",
				lastError: errorMessage,
				completedAt: new Date(),
			});

			return {
				status: "failed",
				reason: "unexpected_error",
			};
		}
	},
});
