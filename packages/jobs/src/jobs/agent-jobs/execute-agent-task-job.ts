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
import { calculateTokenUsageCost, checkPlanFeatures } from "@mimir/billing";
import { createActivity, getActivities } from "@mimir/db/queries/activities";
import { getAgentByUserId } from "@mimir/db/queries/agents";
import {
	getChatById,
	saveChat,
	saveChatMessage,
} from "@mimir/db/queries/chats";
import { getChecklistItems } from "@mimir/db/queries/checklists";
import { getCreditBalance, recordCreditUsage } from "@mimir/db/queries/credits";
import {
	addTaskExecutionUsageMetrics,
	createTaskExecution,
	getTaskExecutionByTaskId,
	updateTaskExecution,
} from "@mimir/db/queries/task-executions";
import { createTaskComment, getTaskById } from "@mimir/db/queries/tasks";
import { getTeamById } from "@mimir/db/queries/teams";
import { getMimirUser } from "@mimir/db/queries/users";
import { AGENT_DEFAULT_MODEL } from "@mimir/utils/agents";
import { logger, schemaTask } from "@trigger.dev/sdk";
import { convertToModelMessages, generateId, stepCountIs } from "ai";
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

		const {
			task,
			executorContext,
			agentConfig,
			execution,
			userIntegrations,
			userId,
			focusedChecklistItem,
		} = await getTaskExecutorContext({
			taskId,
			teamId,
			checklistItemId,
		});

		if (!task) {
			await updateTaskExecution({
				taskId: taskId,
				status: "failed",
				lastError: "Task not found",
			});
			return { status: "failed", reason: "task_not_found" };
		}

		// If focusing on a checklist item, find it and determine the agent to use

		// const execution = await createTaskExecution({ taskId, teamId });

		if (execution.status === "executing") {
			logger.warn("Task execution already in progress", { taskId });
			await updateTaskExecution({
				taskId,
				contextStale: true,
			});
			return { status: "failed", reason: "execution_already_in_progress" };
		}

		// Build appropriate message based on focus mode
		const messageText = focusedChecklistItem
			? execution.status === "pending"
				? `You have been assigned to complete the following checklist item: "${focusedChecklistItem.description}". Please resolve this item.`
				: "Check the last message and evaluate next steps based on the current checklist item state."
			: execution.status === "pending"
				? "Resolve the task."
				: "Check the last message and evaluate next steps based on the current task state.";

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

		// Use the agent user ID (from checklist item or task assignee), fallback to system user

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

		const creditBalance = await getCreditBalance({ teamId });
		if ((creditBalance?.balanceCents ?? 0) <= 0) {
			logger.warn("Insufficient credits for task execution", {
				taskId,
				teamId,
				balanceCents: creditBalance?.balanceCents ?? 0,
			});
			await Promise.all([
				updateTaskExecution({
					taskId,
					status: "failed",
					lastError: "Insufficient credits",
				}),
				createTaskComment({
					taskId,
					teamId,
					userId,
					comment:
						"Execution stopped because your team has no available credits. Please purchase more credits and retry.",
				}),
			]);
			return { status: "failed", reason: "insufficient_credits" };
		}

		// 6. Update status to executing
		await Promise.all([
			updateTaskExecution({
				taskId: taskId,
				status: "executing",
			}),
			createActivity({
				teamId,
				type: "task_execution_started",
				groupId: taskId,
				userId,
				source: "task",
			}),
		]);

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

			let latestExecutorContext = executorContext;
			let latestNewMessages: UIChatMessage[] = [];

			const agent = await createAgentFromDB({
				agentId: agentConfig?.id,
				teamId,
				toolboxes,
				defaultActiveToolboxes: ["taskManagement", "research", "memory"],
				defaultActiveTools: ["updateTaskMemory"],
				config: {
					tools,
					experimental_context: latestExecutorContext,
					stopWhen: stepCountIs(50),
					buildInstructions: buildExecutorSystemPrompt as (
						ctx: AppContext,
					) => string,

					prepareStep: async ({ steps, ...rest }) => {
						const taskExecution = await getTaskExecutionByTaskId(taskId);
						if (!taskExecution) {
							logger.error("Task execution not found during step preparation", {
								taskId,
							});
							return {};
						}

						// If context is marked as stale, refresh it from the database to get latest state
						if (taskExecution.contextStale) {
							logger.warn("Execution context is stale, marking for refresh", {
								taskId,
							});
							const { executorContext: newExecutorContext, newMessages } =
								await getTaskExecutorContext({
									taskId,
									teamId,
									checklistItemId,
								});
							latestExecutorContext = newExecutorContext;
							latestNewMessages = [
								...latestNewMessages,
								...newMessages.filter(
									(m) => !latestNewMessages.find((lm) => lm.id === m.id),
								),
							];

							await updateTaskExecution({
								taskId,
								contextStale: false,
							});
						}

						return {
							experimental_context: latestExecutorContext,
							messages: [
								...rest.messages,
								...(latestNewMessages?.length > 0
									? await convertToModelMessages(latestNewMessages)
									: []),
							],
						};
					},
					onStepFinish: async ({ toolResults }) => {
						for (const call of toolResults) {
							logger.info(`Tool: ${call.toolName}`, {
								toolName: call.toolName,
								input: call.input,
								output: call.output,
							});
						}
					},
					onFinish: async ({ totalUsage, finishReason }) => {
						const usageCost = await calculateTokenUsageCost({
							model: agentConfig?.model || AGENT_DEFAULT_MODEL,
							usage: totalUsage,
						});
						await addTaskExecutionUsageMetrics(task.id, {
							inputTokens: totalUsage.inputTokens || 0,
							outputTokens: totalUsage.outputTokens || 0,
							totalTokens: totalUsage.totalTokens || 0,
							costUSD: usageCost?.costUSD || 0,
						});

						const usageCostCents = Math.round((usageCost?.costUSD || 0) * 100);
						if (usageCostCents > 0) {
							await recordCreditUsage({
								teamId,
								amountCents: usageCostCents,
								metadata: {
									taskId,
									model:
										usageCost?.model ||
										agentConfig?.model ||
										AGENT_DEFAULT_MODEL,
									inputTokens: totalUsage.inputTokens || 0,
									outputTokens: totalUsage.outputTokens || 0,
									totalTokens: totalUsage.totalTokens || 0,
									costUSD: usageCost?.costUSD || 0,
								},
							});
						}
						logger.info("Agent OnFinish", { totalUsage, finishReason });
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

			await Promise.all([
				updateTaskExecution({
					taskId: taskId,
					status: "completed",
					completedAt: new Date().toISOString(),
				}),
				createActivity({
					teamId,
					type: "task_execution_completed",
					groupId: taskId,
					userId,
					source: "task",
				}),
			]);
		} catch (error) {
			logger.error("Unexpected error during plan execution", { error });
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";

			await updateTaskExecution({
				taskId: taskId,
				status: "failed",
				lastError: errorMessage,
				completedAt: new Date().toISOString(),
			});

			return {
				status: "failed",
				reason: "unexpected_error",
			};
		}
	},
});

const getTaskExecutorContext = async ({
	taskId,
	checklistItemId,
	teamId,
}: {
	taskId: string;
	checklistItemId?: string;
	teamId: string;
}) => {
	const task = await getTaskById(taskId);
	const execution = await createTaskExecution({ taskId, teamId });
	const systemUser = await getMimirUser({
		teamId,
	});
	if (!systemUser) {
		return { status: "failed", reason: "system_user_not_found" };
	}

	let agentUserId: string | null = null;
	let focusedChecklistItem:
		| {
				id: string;
				description: string;
				isCompleted: boolean;
				assigneeId?: string;
		  }
		| undefined;

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

	const userId = agentConfig
		? agentConfig.userId
		: (agentUserId ?? systemUser.id);

	const userContext = await getUserContext({
		userId,
		teamId,
	});

	const userIntegrations = await getUserAvailableIntegrations({
		userId: agentConfig?.behalfUserId ?? task.createdBy,
		teamId,
	});
	const enabledIntegrations = getEnabledIntegrationTypes(userIntegrations);

	const activitiesResult = await getActivities({
		groupId: taskId,
		teamId,
		type: ["task_comment", "task_comment_reply"],
		pageSize: 20,
	});

	const activitiesAsMessages = activitiesResult.data.map((a) => ({
		id: a.id,
		message: {
			role: a.userId === userContext.userId ? "assistant" : "user",
			id: a.id,
			parts: [{ type: "text", text: a.metadata?.comment || "" }],
		} as UIChatMessage,
		userId: a.userId,
		createdAt: a.createdAt!,
	}));

	const chat = await getChatById(taskId, teamId);
	let allMessages: UIChatMessage[] = [...(chat?.messages ?? [])];
	if (!chat) {
		await saveChat({
			chatId: taskId,
			teamId,
			title: `${task.title} - Execution Chat`,
			userId,
		});
	}

	const unsavedMessages = activitiesAsMessages
		.filter((a) => !chat?.messages.find((m) => m.id === a.id))
		.sort(
			(a, b) =>
				new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
		);

	const savedMessages = await Promise.all(
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

	const savedMessageUI = savedMessages.map((m) => m.content);
	allMessages = [...allMessages, ...savedMessageUI];

	const executorContext: TaskExecutorContext = {
		...buildAppContext(
			{
				...userContext,
				agentId: agentConfig?.id,
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
		// Agent identity for long-term memory
		agentId: agentConfig?.id,
	};

	return {
		executorContext,
		agentConfig,
		userIntegrations,
		userId,
		execution,
		focusedChecklistItem,
		task,
		messages: allMessages,
		newMessages: savedMessageUI,
		agentUserId,
	};
};
