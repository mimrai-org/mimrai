import {
	getEnabledIntegrationTypes,
	getUserAvailableIntegrations,
} from "@api/ai/agents/agent-factory";
import { buildAppContext } from "@api/ai/agents/config/shared";
import {
	executePlan,
	generateProgressComment,
	isPlanReadyToExecute,
	type TaskExecutorContext,
} from "@api/ai/agents/task-executor";
import { getUserContext } from "@api/ai/utils/get-user-context";
import { getActivities } from "@mimir/db/queries/activities";
import { getAgentExecutionPolicy } from "@mimir/db/queries/autopilot-settings";
import { createChecklistItem } from "@mimir/db/queries/checklists";
import { getStatuses } from "@mimir/db/queries/statuses";
import {
	addHumanSubtaskToMemory,
	getTaskExecutionById,
	updateTaskExecution,
	updateTaskExecutionPlanStep,
} from "@mimir/db/queries/task-executions";
import {
	createTaskComment,
	getTaskById,
	updateTask,
} from "@mimir/db/queries/tasks";
import { getSystemUser } from "@mimir/db/queries/users";
import type { TaskExecutionPlanStep } from "@mimir/db/schema";
import { logger, schemaTask, wait } from "@trigger.dev/sdk";
import z from "zod";

const MAX_RETRIES = 3;

/**
 * Job that executes an agent task plan using a unified agentic approach
 *
 * This job:
 * 1. Validates the execution state
 * 2. Executes the full plan in a single AI agentic loop (token-efficient)
 * 3. Handles human delegation via checklist items
 * 4. Posts progress comments
 * 5. Completes the task when done
 */
export const executeAgentTaskPlanJob = schemaTask({
	id: "execute-agent-task-plan",
	schema: z.object({
		executionId: z.string(),
		taskId: z.string(),
		teamId: z.string(),
	}),
	run: async (payload) => {
		const { executionId, taskId, teamId } = payload;

		logger.info("Starting agent plan execution", {
			executionId,
			taskId,
		});

		// 1. Get execution record
		const execution = await getTaskExecutionById(executionId);
		if (!execution) {
			logger.error("Execution not found", { executionId });
			return { status: "failed", reason: "execution_not_found" };
		}

		// 2. Validate execution state
		if (execution.status === "completed" || execution.status === "failed") {
			logger.info("Execution already in terminal state", {
				status: execution.status,
			});
			return { status: "failed", reason: `already_${execution.status}` };
		}

		if (execution.status === "awaiting_confirmation") {
			// Check if plan is ready
			if (!isPlanReadyToExecute(execution.plan ?? [])) {
				logger.info("Still waiting for confirmation");
				return { status: "blocked", reason: "awaiting_confirmation" };
			}
		}

		// 3. Get system user and task
		const systemUser = await getSystemUser();
		if (!systemUser) {
			return { status: "failed", reason: "system_user_not_found" };
		}

		const task = await getTaskById(taskId);
		if (!task) {
			await updateTaskExecution({
				id: executionId,
				status: "failed",
				lastError: "Task not found",
			});
			return { status: "failed", reason: "task_not_found" };
		}

		// 4. Get execution policy
		const policy = await getAgentExecutionPolicy(teamId);

		// 5. Build executor context
		const userContext = await getUserContext({
			userId: systemUser.id,
			teamId,
		});

		const activitiesResult = await getActivities({
			groupId: taskId,
			teamId,
			type: ["task_comment", "task_comment_reply"],
			pageSize: 20,
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
				status: task.status?.name,
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

		// 6. Update status to executing
		await updateTaskExecution({
			id: executionId,
			status: "executing",
		});

		const plan = execution.plan ?? [];

		// 7. Check for any high-risk steps that need confirmation first
		const pendingHighRiskSteps = plan.filter(
			(s) => s.riskLevel === "high" && s.status === "pending",
		);
		if (pendingHighRiskSteps.length > 0) {
			logger.info("High-risk steps still pending confirmation", {
				count: pendingHighRiskSteps.length,
			});
			await updateTaskExecution({
				id: executionId,
				status: "awaiting_confirmation",
			});
			return {
				status: "blocked",
				reason: "steps_require_confirmation",
			};
		}

		// 8. Check for steps requiring human delegation BEFORE starting execution
		for (const step of plan) {
			if (
				step.status !== "completed" &&
				step.status !== "rejected" &&
				step.status !== "skipped"
			) {
				if (await shouldDelegateToHuman(step, policy.allowedActions)) {
					logger.info(`Step ${step.order + 1} requires human delegation`);
					await handleHumanDelegation(
						executionId,
						taskId,
						teamId,
						step,
						systemUser.id,
						executorContext,
					);

					// Mark as blocked waiting for human
					await updateTaskExecution({
						id: executionId,
						status: "blocked",
						currentStepIndex: step.order,
						nextCheckAt: new Date(Date.now() + 12 * 60 * 60 * 1000), // Check in 12 hours
					});

					return {
						status: "blocked",
						reason: "waiting_for_human",
					};
				}
			}
		}

		// 9. Execute the entire plan using the unified agentic approach
		logger.info("Starting unified plan execution", {
			totalSteps: plan.length,
			pendingSteps: plan.filter(
				(s) =>
					s.status === "pending" ||
					(s.status === "confirmed" && s.riskLevel === "high"),
			).length,
		});

		try {
			const executionResult = await executePlan(
				{ ...executorContext, currentPlan: plan },
				plan,
				// Optional callback for step completion tracking
				async (completedStep) => {
					await updateTaskExecutionPlanStep(executionId, completedStep.id, {
						status: "completed",
						result: completedStep.result,
						executedAt: new Date().toISOString(),
					});
				},
			);

			if (!executionResult.success) {
				logger.warn("Plan execution failed", {
					error: executionResult.error,
					failedStep: executionResult.failedStep?.description,
				});

				const retryCount = (execution.retryCount ?? 0) + 1;
				if (retryCount < MAX_RETRIES) {
					// Retry the execution
					await updateTaskExecution({
						id: executionId,
						retryCount,
						lastError: executionResult.error,
					});

					// Re-trigger with delay
					await wait.for({ seconds: 30 });

					await executeAgentTaskPlanJob.trigger({
						executionId,
						taskId,
						teamId,
					});

					return {
						status: "blocked" as const,
						reason: "retrying",
					};
				}

				// Max retries reached - fail
				if (executionResult.failedStep) {
					await updateTaskExecutionPlanStep(
						executionId,
						executionResult.failedStep.id,
						{
							status: "failed",
							error: executionResult.error,
						},
					);
				}

				// Post failure comment
				await createTaskComment({
					taskId,
					userId: systemUser.id,
					teamId,
					comment: `❌ I encountered an issue executing the plan${executionResult.failedStep ? ` at step: "${executionResult.failedStep.description}"` : ""}\n\nError: ${executionResult.error}\n\nPlease check if the task needs adjustment or reassign to a team member.`,
				});

				await updateTaskExecution({
					id: executionId,
					status: "failed",
					lastError: `Execution failed after ${MAX_RETRIES} retries: ${executionResult.error}`,
					completedAt: new Date(),
				});

				return {
					status: "failed",
					reason: "execution_failed",
				};
			}

			// Success! Update all step statuses
			const completedSteps = executionResult.completedSteps.length;
			const skippedSteps = plan.filter(
				(s) => s.status === "rejected" || s.status === "skipped",
			).length;

			logger.info("Plan execution completed successfully", {
				completedSteps,
				skippedSteps,
				summary: executionResult.summary,
			});

			// 10. Finalize task - Get the appropriate final status
			const statusesResult = await getStatuses({ teamId, pageSize: 100 });
			const reviewStatus = statusesResult.data.find((s) => s.type === "review");
			const doneStatus = statusesResult.data.find((s) => s.type === "done");

			const finalStatus = policy.requireReviewForCompletion
				? (reviewStatus ?? doneStatus)
				: doneStatus;

			if (finalStatus && finalStatus.id !== task.statusId) {
				await updateTask({
					id: taskId,
					statusId: finalStatus.id,
					userId: systemUser.id,
				});
			}

			// Post completion comment
			const completionComment = await generateProgressComment(
				executorContext,
				`I've completed all ${completedSteps} steps for this task.${
					skippedSteps > 0 ? ` (${skippedSteps} steps were skipped)` : ""
				}${
					policy.requireReviewForCompletion
						? " I've moved it to review for your verification."
						: ""
				}`,
			);

			await createTaskComment({
				taskId,
				userId: systemUser.id,
				teamId,
				comment: completionComment,
			});

			await updateTaskExecution({
				id: executionId,
				status: "completed",
				completedAt: new Date(),
			});

			return {
				status: "completed",
				stepsCompleted: completedSteps,
				stepsSkipped: skippedSteps,
			};
		} catch (error) {
			logger.error("Unexpected error during plan execution", { error });
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";

			await updateTaskExecution({
				id: executionId,
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

/**
 * Check if a step should be delegated to a human
 */
async function shouldDelegateToHuman(
	step: TaskExecutionPlanStep,
	allowedActions: string[],
): Promise<boolean> {
	const replaceRegex = /(\s|_)+/g;
	const allowedActionsFormatted = allowedActions.map((a) =>
		a.replace(replaceRegex, "").toLowerCase(),
	);
	const stepActionFormatted = step.action
		.replace(replaceRegex, "")
		.toLowerCase();

	// If action is explicitly not allowed, delegate to human
	if (!allowedActionsFormatted.includes(stepActionFormatted)) {
		return true;
	}

	// Check for specific actions that always need human
	const humanRequiredActions = [
		"manual_task",
		"physical_action",
		"approval_required",
		"external_system",
	];

	const humanRequiredActionsFormatted = humanRequiredActions.map((a) =>
		a.replace(replaceRegex, "").toLowerCase(),
	);

	return humanRequiredActionsFormatted.some(
		(action) =>
			stepActionFormatted.includes(action) ||
			step.description.toLowerCase().includes(action),
	);
}

/**
 * Create a checklist item for human delegation and notify
 */
async function handleHumanDelegation(
	executionId: string,
	taskId: string,
	teamId: string,
	step: TaskExecutionPlanStep,
	systemUserId: string,
	_ctx: TaskExecutorContext,
): Promise<void> {
	// Create checklist item
	const checklistItem = await createChecklistItem({
		taskId,
		teamId,
		description: `[Agent Request] ${step.description}`,
		// Don't assign to anyone specific - let the team decide
	});

	// Track in execution memory
	await addHumanSubtaskToMemory(executionId, {
		checklistItemId: checklistItem.id,
		description: step.description,
		assigneeId: "", // Not assigned yet
	});

	// Update step status
	await updateTaskExecutionPlanStep(executionId, step.id, {
		status: "pending",
		result: `Delegated to human: checklist item ${checklistItem.id}`,
	});

	// Post comment explaining the delegation
	await createTaskComment({
		taskId,
		userId: systemUserId,
		teamId,
		comment: `⏸️ I need help with a step I can't complete myself:

**${step.description}**

${step.riskReason ? `Reason: ${step.riskReason}` : ""}

I've created a checklist item for this. Please complete it or assign it to someone who can help. Once it's done, I'll continue with the remaining steps.`,
	});
}
