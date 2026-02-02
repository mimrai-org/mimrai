import { openai } from "@ai-sdk/openai";
import {
	getEnabledIntegrationTypes,
	getUserAvailableIntegrations,
} from "@api/ai/agents/agent-factory";
import { buildAppContext } from "@api/ai/agents/config/shared";
import {
	analyzeAndPlan,
	generateConfirmationComment,
	generateProgressComment,
	planRequiresConfirmation,
	type TaskExecutorContext,
} from "@api/ai/agents/task-executor";
import { getUserContext } from "@api/ai/utils/get-user-context";
import { getActivities } from "@mimir/db/queries/activities";
import {
	getAgentExecutionPolicy,
	isAgentExecutionEnabled,
} from "@mimir/db/queries/autopilot-settings";
import {
	createTaskExecution,
	getActiveTaskExecution,
	updateTaskExecution,
	updateTaskExecutionMemory,
} from "@mimir/db/queries/task-executions";
import { createTaskComment, getTaskById } from "@mimir/db/queries/tasks";
import { getSystemUser } from "@mimir/db/queries/users";
import type { TaskExecutionMemory } from "@mimir/db/schema";
import { logger, schemaTask } from "@trigger.dev/sdk";
import { generateText } from "ai";
import z from "zod";
import { executeAgentTaskPlanJob } from "./execute-agent-task-plan-job";

/**
 * Generate a simple hash of task content for change detection
 */
function generateContentHash(title: string, description?: string): string {
	const content = `${title}|${description ?? ""}`;
	// Simple hash for change detection
	let hash = 0;
	for (let i = 0; i < content.length; i++) {
		const char = content.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash; // Convert to 32bit integer
	}
	return hash.toString(36);
}
/**
 * Check if task content has meaningfully changed since last analysis
 */
function hasContentChanged(
	task: { title: string; description?: string | null },
	memory: TaskExecutionMemory | null | undefined,
	commentCount: number,
): { changed: boolean; reason?: string } {
	if (!memory?.analyzedContentHash) {
		return { changed: true, reason: "no_previous_analysis" };
	}

	const currentHash = generateContentHash(
		task.title,
		task.description ?? undefined,
	);
	if (currentHash !== memory.analyzedContentHash) {
		return { changed: true, reason: "content_changed" };
	}

	// Check if new comments were added
	const previousCommentCount = memory.analyzedCommentCount ?? 0;
	if (commentCount > previousCommentCount) {
		return { changed: true, reason: "new_comments" };
	}

	return { changed: false };
}

/**
 * Job triggered when a task is assigned to an AI agent (system user)
 * This job:
 * 1. Validates the task and team settings
 * 2. Analyzes the task context (only if meaningful changes detected)
 * 3. Creates or updates execution state
 * 4. Creates an execution plan
 * 5. Requests confirmation for high-risk steps via task comment
 * 6. Triggers plan execution (or waits for confirmation)
 */
export const agentTaskAssignedJob = schemaTask({
	id: "agent-task-assigned",
	schema: z.object({
		taskId: z.string(),
		teamId: z.string(),
		triggeredBy: z.enum(["assignment", "update", "comment", "checklist"]),
		/** User ID who triggered this (for context) */
		triggerUserId: z.string().optional(),
	}),
	run: async (payload) => {
		const { taskId, teamId, triggeredBy } = payload;

		logger.info("Agent task assigned job started", {
			taskId,
			teamId,
			triggeredBy,
		});

		// 1. Validate agent execution is enabled for this team
		const isEnabled = await isAgentExecutionEnabled(teamId);
		if (!isEnabled) {
			logger.info("Agent execution is disabled for team, skipping");
			return { status: "skipped", reason: "agent_execution_disabled" };
		}

		// 2. Get system user (Agent)
		const systemUser = await getSystemUser();
		if (!systemUser) {
			logger.error("System user not found");
			return { status: "error", reason: "system_user_not_found" };
		}

		// 3. Get task details
		const task = await getTaskById(taskId);
		if (!task) {
			logger.warn(`Task ${taskId} not found`);
			return { status: "error", reason: "task_not_found" };
		}

		// 4. Verify task is still assigned to agent
		if (task.assigneeId !== systemUser.id) {
			logger.info("Task is no longer assigned to agent, skipping");
			return { status: "skipped", reason: "not_assigned_to_agent" };
		}

		// 5. Get or create task execution record
		let execution = await getActiveTaskExecution(taskId);
		let isNewExecution = false;

		if (!execution) {
			execution = await createTaskExecution({ taskId, teamId });
			isNewExecution = true;
			logger.info("Created new task execution", { taskId });
		} else {
			logger.info("Found existing execution", {
				taskId,
				status: execution.status,
			});

			// If already executing, don't interrupt
			if (execution.status === "executing") {
				logger.info(
					"Task is currently executing, will handle update after current step",
				);
				return { status: "skipped", reason: "already_executing" };
			}

			// If completed or failed, create new execution only for fresh assignment
			if (execution.status === "completed" || execution.status === "failed") {
				if (triggeredBy === "assignment") {
					execution = await createTaskExecution({ taskId, teamId });
					isNewExecution = true;
					logger.info(
						"Created new execution after previous completion/failure",
					);
				} else {
					logger.info(
						"Task already completed/failed, ignoring non-assignment trigger",
					);
					return { status: "skipped", reason: "already_completed" };
				}
			}
		}

		// 6. Get task activities for context (needed for change detection)
		const activitiesResult = await getActivities({
			groupId: taskId,
			teamId,
			type: ["task_comment", "task_comment_reply"],
			pageSize: 50,
		});

		// Count human comments (excluding agent's own comments)
		const humanCommentCount = activitiesResult.data.filter(
			(a) => a.userId !== systemUser.id,
		).length;

		// 7. Check if we need to re-analyze based on meaningful changes
		const contentChange = hasContentChanged(
			task,
			execution.memory,
			humanCommentCount,
		);

		// For "update" triggers, only proceed if meaningful changes detected
		if (triggeredBy === "update" && !contentChange.changed) {
			logger.info("No meaningful content changes detected, skipping analysis", {
				status: execution.status,
			});
			return { status: "skipped", reason: "no_meaningful_changes" };
		}

		// 8. Handle existing states smartly
		if (!isNewExecution && execution.memory?.taskAnalysis) {
			// We have a previous analysis

			// If blocked waiting for answers and trigger is "comment", check if questions were answered
			if (execution.status === "blocked" && triggeredBy === "comment") {
				const hasUnansweredQuestions = execution.memory.qaPairs?.some(
					(qa) => !qa.answer,
				);
				if (hasUnansweredQuestions) {
					logger.info(
						"New comment received, checking if it answers pending questions",
					);
					// Let the analysis proceed to evaluate if questions were answered
				}
			}

			// If awaiting confirmation, check if there are new comments that might contain confirmation
			// The planner will intelligently detect confirmations in any language from the activity context
			if (execution.status === "awaiting_confirmation") {
				const confirmationRequestedAt = execution.confirmationRequestedAt;
				const hasNewCommentsAfterConfirmationRequest =
					activitiesResult.data.some(
						(a) =>
							a.type === "task_comment" &&
							a.userId !== systemUser.id &&
							confirmationRequestedAt &&
							a.createdAt &&
							new Date(a.createdAt) > new Date(confirmationRequestedAt),
					);

				if (hasNewCommentsAfterConfirmationRequest) {
					logger.info(
						"New comments after confirmation request, re-evaluating plan",
					);
					// Continue to re-plan - the AI will detect confirmation in the activity context
				} else if (!contentChange.changed) {
					logger.info("Still awaiting confirmation, no new comments");
					return {
						status: "skipped",
						reason: "awaiting_confirmation_no_changes",
					};
				}
			}

			// If we have a plan and just a checklist update, evaluate checklist progress instead
			if (triggeredBy === "checklist" && execution.plan?.length) {
				logger.info(
					"Checklist update on task with existing plan, checking progress",
				);
				// Continue to re-evaluate, but we'll use existing analysis
			}
		}

		// 9. Get execution policy
		const policy = await getAgentExecutionPolicy(teamId);

		// 10. Get status info
		const status = task.status;

		// 11. Build executor context
		const userContext = await getUserContext({
			userId: systemUser.id,
			teamId,
		});

		// Get enabled integrations for the system user
		const userIntegrations = await getUserAvailableIntegrations({
			userId: systemUser.id,
			teamId,
		});
		const enabledIntegrations = getEnabledIntegrationTypes(userIntegrations);

		const executorContext: TaskExecutorContext = {
			...buildAppContext(
				{ ...userContext, integrationType: "web" },
				systemUser.id,
			),
			task: {
				id: task.id,
				title: task.title,
				description: task.description ?? undefined,
				status: status?.name,
				statusId: task.statusId,
				priority: task.priority ?? undefined,
				assignee: task.assignee?.name ?? undefined,
				assigneeId: task.assigneeId ?? undefined,
				project: task.project?.name ?? undefined,
				projectId: task.projectId ?? undefined,
				milestone: task.milestone?.name ?? undefined,
				milestoneId: task.milestoneId ?? undefined,
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
			currentPlan: execution.plan ?? undefined,
			allowedActions: policy.allowedActions,
			alwaysConfirmActions: policy.alwaysConfirmActions,
			enabledIntegrations,
		};

		// 10. Update execution status to analyzing
		await updateTaskExecution({
			id: execution.id,
			status: "analyzing",
			startedAt: new Date(),
		});

		try {
			// 11. Analyze the task AND create plan in a single call (token-efficient)
			logger.info("Analyzing task and creating plan", { title: task.title });
			const { analysis, plan, estimatedDuration, warnings } =
				await analyzeAndPlan(executorContext);

			logger.info("Task analysis and planning complete", {
				canProceed: analysis.canProceed,
				questionsCount: analysis.questions.length,
				humanHelpNeeded: analysis.needsHumanHelp.length,
				planSteps: plan?.length ?? 0,
				estimatedDuration,
				warnings,
			});

			// 12. Update memory with analysis (including content hash for change detection)
			await updateTaskExecutionMemory(execution.id, {
				taskAnalysis: analysis.summary,
				contextSummary: analysis.requirements.join("; "),
				analyzedContentHash: generateContentHash(task.title, task.description),
				analyzedAt: new Date().toISOString(),
				analyzedCommentCount: humanCommentCount,
			});

			// 13. If we need more info, ask questions and wait
			if (!analysis.canProceed && analysis.questions.length > 0) {
				// Filter out questions that were already asked
				const previouslyAsked =
					execution.memory?.qaPairs?.map((qa) =>
						qa.question.toLowerCase().trim(),
					) ?? [];
				const newQuestions = analysis.questions.filter(
					(q) => !previouslyAsked.includes(q.toLowerCase().trim()),
				);

				// If all questions were already asked, don't ask again
				if (newQuestions.length === 0) {
					logger.info("All questions were already asked, waiting for answers", {
						previouslyAskedCount: previouslyAsked.length,
					});
					return {
						status: "blocked",
						reason: "waiting_for_previous_questions",
						questionsCount: previouslyAsked.length,
					};
				}

				logger.info("Agent needs more info, asking questions", {
					newQuestionsCount: newQuestions.length,
					skippedCount: analysis.questions.length - newQuestions.length,
				});

				const questionsComment = await generateQuestionsComment(
					executorContext,
					newQuestions,
				);

				// Post comment with questions
				await createTaskComment({
					taskId,
					userId: systemUser.id,
					teamId,
					comment: questionsComment,
				});

				// Update execution with questions (merge with existing)
				const existingQaPairs = execution.memory?.qaPairs ?? [];
				await updateTaskExecution({
					id: execution.id,
					status: "blocked",
					memory: {
						...(execution.memory ?? {}),
						taskAnalysis: analysis.summary,
						qaPairs: [
							...existingQaPairs,
							...newQuestions.map((q) => ({
								question: q,
								askedAt: new Date().toISOString(),
							})),
						],
						blockers: [
							{
								description: "Waiting for answers to questions",
								resolved: false,
							},
						],
					},
					// Check back in 24 hours if no response
					nextCheckAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
				});

				return {
					status: "blocked",
					reason: "questions_asked",
					questionsCount: newQuestions.length,
				};
			}

			// 14. If no plan was generated but we can proceed, something is wrong
			if (!plan || plan.length === 0) {
				logger.warn("No execution plan generated despite canProceed=true");
				await updateTaskExecution({
					id: execution.id,
					status: "failed",
					lastError: "No execution plan could be generated",
				});
				return {
					status: "error",
					reason: "no_plan_generated",
				};
			}

			logger.info("Execution plan ready", {
				stepsCount: plan.length,
				highRiskSteps: plan.filter((s) => s.riskLevel === "high").length,
				estimatedDuration,
			});

			// 15. Update execution with plan
			await updateTaskExecution({
				id: execution.id,
				status: "planning",
				plan,
				currentStepIndex: 0,
			});

			// 16. Check if confirmation is needed
			if (planRequiresConfirmation(plan)) {
				// Check if we already requested confirmation for a similar plan
				const alreadyRequestedConfirmation =
					execution.confirmationRequestedAt &&
					execution.confirmationCommentId &&
					!isNewExecution;

				if (alreadyRequestedConfirmation) {
					logger.info(
						"Confirmation already requested previously, waiting for response",
						{
							requestedAt: execution.confirmationRequestedAt,
							commentId: execution.confirmationCommentId,
						},
					);
					return {
						status: "awaiting_confirmation",
						reason: "confirmation_already_requested",
						planSteps: plan.length,
					};
				}

				logger.info("Plan requires confirmation for high-risk steps");

				// Generate and post confirmation request comment
				const confirmationComment = await generateConfirmationComment(
					{ ...executorContext, currentPlan: plan },
					plan,
				);

				const commentActivity = await createTaskComment({
					taskId,
					userId: systemUser.id,
					teamId,
					comment: confirmationComment,
				});

				await updateTaskExecution({
					id: execution.id,
					status: "awaiting_confirmation",
					confirmationRequestedAt: new Date(),
					confirmationCommentId: commentActivity?.id,
					// Check back in 48 hours if no response
					nextCheckAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
				});

				return {
					status: "awaiting_confirmation",
					planSteps: plan.length,
					highRiskSteps: plan.filter((s) => s.riskLevel === "high").length,
				};
			}

			// 17. No confirmation needed, start execution
			logger.info("No confirmation needed, triggering plan execution");

			// Post a comment that we're starting
			const startComment = await generateProgressComment(
				executorContext,
				"I'm starting to work on this task now.",
			);
			await createTaskComment({
				taskId,
				userId: systemUser.id,
				teamId,
				comment: startComment,
			});

			await updateTaskExecution({
				id: execution.id,
				status: "executing",
			});

			// Trigger the plan execution job
			await executeAgentTaskPlanJob.trigger({
				executionId: execution.id,
				taskId,
				teamId,
			});

			return {
				status: "executing",
				planSteps: plan.length,
			};
		} catch (error) {
			logger.error("Error in agent task assigned job", { error });

			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";

			await updateTaskExecution({
				id: execution.id,
				status: "failed",
				lastError: errorMessage,
			});

			// Post error comment
			await createTaskComment({
				taskId,
				userId: systemUser.id,
				teamId,
				comment: `I encountered an error while analyzing this task: ${errorMessage}. I'll try again later or please reassign if needed.`,
			});

			return {
				status: "error",
				error: errorMessage,
			};
		}
	},
});

/**
 * Generate a conversational comment asking questions
 * Uses AI to make the message feel natural and contextual
 */
async function generateQuestionsComment(
	ctx: TaskExecutorContext,
	questions: string[],
): Promise<string> {
	const questionsList = questions.map((q, i) => `${i + 1}. ${q}`).join("\n");

	// Determine conversation context
	const previousQuestionsCount = ctx.executionMemory?.qaPairs?.length ?? 0;
	const isFollowUp = previousQuestionsCount > 0;
	const hasRecentActivity = ctx.activities.length > 0;
	const lastActivityUser = ctx.activities[0]?.userName;

	const contextInfo = isFollowUp
		? `This is a follow-up. I previously asked ${previousQuestionsCount} question(s). The user has responded or updated the task.`
		: "This is my first time looking at this task.";

	const result = await generateText({
		model: openai("gpt-4o-mini"),
		system: `You are an AI assistant having a natural conversation about a task. You need to ask some clarifying questions.

Task: "${ctx.task.title}"
${ctx.task.description ? `Description: ${ctx.task.description}` : ""}

Context:
- ${contextInfo}
${hasRecentActivity && lastActivityUser ? `- Last activity was from ${lastActivityUser}` : ""}
- Keep the tone friendly and conversational
- Don't use formal greetings like "Dear" or sign-offs
- ${isFollowUp ? "Acknowledge their response and ask follow-up naturally" : "Introduce yourself briefly but don't be overly formal"}
- Be concise - no need for lengthy explanations
- Don't repeat the same introduction patterns`,
		prompt: `Write a brief, conversational comment to ask these questions:

${questionsList}

Make it feel like a natural conversation, not a template. ${isFollowUp ? "This is a follow-up question based on their previous answer." : ""}`,
	});

	return result.text;
}
