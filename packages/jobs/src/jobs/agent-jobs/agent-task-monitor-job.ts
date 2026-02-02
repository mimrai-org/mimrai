import { getActivities } from "@mimir/db/queries/activities";
import { getChecklistItems } from "@mimir/db/queries/checklists";
import {
	confirmPlanSteps,
	getTaskExecutionById,
	getTaskExecutionsNeedingCheck,
	updateTaskExecution,
} from "@mimir/db/queries/task-executions";
import { createTaskComment, getTaskById } from "@mimir/db/queries/tasks";
import { getSystemUser } from "@mimir/db/queries/users";
import { logger, schedules, schemaTask } from "@trigger.dev/sdk";
import z from "zod";
import { agentTaskAssignedJob } from "./agent-task-assigned-job";
import { executeAgentTaskPlanJob } from "./execute-agent-task-plan-job";

/**
 * Scheduler that runs every 2 hours to check on agent task executions
 *
 * This job:
 * 1. Finds executions that need attention (nextCheckAt reached)
 * 2. Checks for new comments/answers on blocked tasks
 * 3. Checks for completed human subtasks
 * 4. Processes confirmation responses
 * 5. Schedules follow-ups for stale tasks
 */
export const agentTaskMonitorScheduler = schedules.task({
	id: "agent-task-monitor-scheduler",
	cron: "0 */2 * * *", // Every 2 hours
	run: async () => {
		logger.info("Agent task monitor starting");

		const now = new Date();
		const executions = await getTaskExecutionsNeedingCheck(now);

		logger.info(`Found ${executions.length} executions needing attention`);

		let processed = 0;
		let reactivated = 0;
		let followUpsScheduled = 0;

		for (const execution of executions) {
			try {
				const result = await processExecution(execution);
				processed++;
				if (result === "reactivated") reactivated++;
				if (result === "follow_up") followUpsScheduled++;
			} catch (error) {
				logger.error(`Error processing execution ${execution.id}`, { error });
			}
		}

		logger.info("Agent task monitor completed", {
			processed,
			reactivated,
			followUpsScheduled,
		});

		return { processed, reactivated, followUpsScheduled };
	},
});

/**
 * Process a single execution that needs attention
 */
async function processExecution(
	execution: Awaited<ReturnType<typeof getTaskExecutionById>>,
): Promise<"reactivated" | "follow_up" | "no_action" | null> {
	if (!execution) return null;

	const systemUser = await getSystemUser();
	if (!systemUser) return null;

	const task = await getTaskById(execution.taskId);
	if (!task) {
		// Task was deleted, clean up execution
		await updateTaskExecution({
			id: execution.id,
			status: "failed",
			lastError: "Task no longer exists",
		});
		return null;
	}

	// Check if task is still assigned to agent
	if (task.assigneeId !== systemUser.id) {
		logger.info("Task no longer assigned to agent, marking as completed");
		await updateTaskExecution({
			id: execution.id,
			status: "completed",
			completedAt: new Date(),
		});
		return null;
	}

	switch (execution.status) {
		case "blocked":
			return await handleBlockedExecution(execution, task, systemUser.id);

		case "awaiting_confirmation":
			return await handleAwaitingConfirmation(execution, task, systemUser.id);

		case "pending":
		case "analyzing":
		case "planning":
			// These states shouldn't be stuck - re-trigger the job
			logger.info("Execution stuck, re-triggering", {
				executionId: execution.id,
				status: execution.status,
			});
			await agentTaskAssignedJob.trigger({
				taskId: execution.taskId,
				teamId: execution.teamId,
				triggeredBy: "update",
			});
			return "reactivated";

		case "executing":
			// Check if the execution job is still running
			// If not, resume it
			return await handleStuckExecution(execution, task, systemUser.id);

		default:
			return "no_action";
	}
}

/**
 * Handle a blocked execution - check for answers or completed subtasks
 */
async function handleBlockedExecution(
	execution: NonNullable<Awaited<ReturnType<typeof getTaskExecutionById>>>,
	_task: NonNullable<Awaited<ReturnType<typeof getTaskById>>>,
	systemUserId: string,
): Promise<"reactivated" | "follow_up" | "no_action"> {
	const memory = execution.memory ?? {};

	// Check for unanswered questions
	if (memory.qaPairs && memory.qaPairs.length > 0) {
		const unansweredQuestions = memory.qaPairs.filter((qa) => !qa.answer);

		if (unansweredQuestions.length > 0) {
			// Check for new comments that might contain answers
			const activities = await getActivities({
				groupId: execution.taskId,
				teamId: execution.teamId,
				type: ["task_comment", "task_comment_reply"],
				pageSize: 20,
			});

			// Find comments after the last question was asked
			const lastQuestionTime = unansweredQuestions[0].askedAt;
			const newComments = activities.data.filter(
				(a) =>
					a.createdAt &&
					new Date(a.createdAt) > new Date(lastQuestionTime) &&
					a.userId !== systemUserId,
			);

			if (newComments.length > 0) {
				// There are new comments - re-analyze
				logger.info("Found new comments on blocked task, re-analyzing", {
					newComments: newComments.length,
				});

				await agentTaskAssignedJob.trigger({
					taskId: execution.taskId,
					teamId: execution.teamId,
					triggeredBy: "comment",
				});

				return "reactivated";
			}

			// No new comments - schedule follow-up if enough time has passed
			const timeSinceQuestion =
				Date.now() - new Date(lastQuestionTime).getTime();
			const hoursWaiting = timeSinceQuestion / (1000 * 60 * 60);

			if (hoursWaiting > 48) {
				// Post a gentle reminder
				await createTaskComment({
					taskId: execution.taskId,
					userId: systemUserId,
					teamId: execution.teamId,
					comment:
						"👋 Friendly reminder: I'm still waiting for answers to my questions above. Please let me know if you need me to approach this differently or if someone else should take over.",
				});

				// Schedule next check for 48 hours later
				await updateTaskExecution({
					id: execution.id,
					nextCheckAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
				});

				return "follow_up";
			}
		}
	}

	// Check for completed human subtasks
	if (memory.humanSubtasks && memory.humanSubtasks.length > 0) {
		const pendingSubtasks = memory.humanSubtasks.filter((st) => !st.completed);

		if (pendingSubtasks.length > 0) {
			// Check actual checklist item status
			const checklistItems = await getChecklistItems({
				taskId: execution.taskId,
				teamId: execution.teamId,
			});

			let anyCompleted = false;
			for (const subtask of pendingSubtasks) {
				const item = checklistItems.find(
					(ci) => ci.id === subtask.checklistItemId,
				);
				if (item?.isCompleted) {
					anyCompleted = true;
					// Update memory
					const updatedSubtasks = memory.humanSubtasks.map((st) =>
						st.checklistItemId === subtask.checklistItemId
							? { ...st, completed: true }
							: st,
					);
					await updateTaskExecution({
						id: execution.id,
						memory: { ...memory, humanSubtasks: updatedSubtasks },
					});
				}
			}

			if (anyCompleted) {
				// Some subtasks completed - check if we can continue
				const stillPending = memory.humanSubtasks.filter(
					(st) => !st.completed,
				).length;

				if (stillPending === 0) {
					// All subtasks done - resume execution
					logger.info("All human subtasks completed, resuming execution");

					await executeAgentTaskPlanJob.trigger({
						executionId: execution.id,
						taskId: execution.taskId,
						teamId: execution.teamId,
						resumeFromStep: (execution.currentStepIndex ?? 0) + 1,
					});

					return "reactivated";
				}
			}
		}
	}

	return "no_action";
}

/**
 * Handle an execution awaiting confirmation
 */
async function handleAwaitingConfirmation(
	execution: NonNullable<Awaited<ReturnType<typeof getTaskExecutionById>>>,
	_task: NonNullable<Awaited<ReturnType<typeof getTaskById>>>,
	systemUserId: string,
): Promise<"reactivated" | "follow_up" | "no_action"> {
	if (!execution.confirmationCommentId || !execution.plan) {
		return "no_action";
	}

	// Get comments after the confirmation request
	const activities = await getActivities({
		groupId: execution.taskId,
		teamId: execution.teamId,
		type: ["task_comment", "task_comment_reply"],
		pageSize: 50,
	});

	const confirmationTime = execution.confirmationRequestedAt
		? new Date(execution.confirmationRequestedAt)
		: new Date(0);

	const responseComments = activities.data.filter(
		(a) =>
			a.createdAt &&
			new Date(a.createdAt) > confirmationTime &&
			a.userId !== systemUserId,
	);

	if (responseComments.length === 0) {
		// No response yet - check if we should send a reminder
		const hoursWaiting =
			(Date.now() - confirmationTime.getTime()) / (1000 * 60 * 60);

		if (hoursWaiting > 72) {
			await createTaskComment({
				taskId: execution.taskId,
				userId: systemUserId,
				teamId: execution.teamId,
				comment:
					"👋 I'm still waiting for confirmation on the high-risk steps in my plan. Reply with the step numbers you approve, or let me know if you'd like me to proceed with only the low-risk actions.",
			});

			await updateTaskExecution({
				id: execution.id,
				nextCheckAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
			});

			return "follow_up";
		}

		return "no_action";
	}

	// Parse responses for confirmation
	const highRiskSteps = execution.plan.filter((s) => s.riskLevel === "high");
	const approvedStepIds: string[] = [];
	const rejectedStepIds: string[] = [];

	for (const comment of responseComments) {
		const content = (comment.metadata?.comment || "").toLowerCase();

		// Check for approval keywords
		if (
			content.includes("approve") ||
			content.includes("confirm") ||
			content.includes("proceed") ||
			content.includes("yes") ||
			content.includes("go ahead")
		) {
			// Check if approving specific steps or all
			if (content.includes("all") || !content.match(/step\s*\d/)) {
				// Approve all
				approvedStepIds.push(...highRiskSteps.map((s) => s.id));
			} else {
				// Parse step numbers
				const stepMatches = content.match(/step\s*(\d+)/gi) || [];
				for (const match of stepMatches) {
					const stepNum = Number.parseInt(match.replace(/\D/g, ""), 10);
					const step = execution.plan.find((s) => s.order === stepNum - 1);
					if (step) {
						approvedStepIds.push(step.id);
					}
				}
			}
		}

		// Check for rejection keywords
		if (
			content.includes("reject") ||
			content.includes("skip") ||
			content.includes("don't") ||
			content.includes("do not") ||
			content.includes("no")
		) {
			// Similar parsing for rejections
			if (content.includes("all")) {
				rejectedStepIds.push(...highRiskSteps.map((s) => s.id));
			} else {
				const stepMatches = content.match(/step\s*(\d+)/gi) || [];
				for (const match of stepMatches) {
					const stepNum = Number.parseInt(match.replace(/\D/g, ""), 10);
					const step = execution.plan.find((s) => s.order === stepNum - 1);
					if (step) {
						rejectedStepIds.push(step.id);
					}
				}
			}
		}
	}

	// Apply confirmations
	if (approvedStepIds.length > 0) {
		await confirmPlanSteps(execution.id, approvedStepIds, true);
	}
	if (rejectedStepIds.length > 0) {
		await confirmPlanSteps(execution.id, rejectedStepIds, false);
	}

	// Check if all high-risk steps are now resolved
	const updatedExecution = await getTaskExecutionById(execution.id);
	if (!updatedExecution) return "no_action";

	const pendingHighRisk = (updatedExecution.plan ?? []).filter(
		(s) => s.riskLevel === "high" && s.status === "pending",
	);

	if (pendingHighRisk.length === 0) {
		// All resolved - start execution
		logger.info("All high-risk steps confirmed/rejected, starting execution");

		await executeAgentTaskPlanJob.trigger({
			executionId: execution.id,
			taskId: execution.taskId,
			teamId: execution.teamId,
		});

		return "reactivated";
	}

	return "no_action";
}

/**
 * Handle an execution that appears stuck in executing state
 */
async function handleStuckExecution(
	execution: NonNullable<Awaited<ReturnType<typeof getTaskExecutionById>>>,
	_task: NonNullable<Awaited<ReturnType<typeof getTaskById>>>,
	_systemUserId: string,
): Promise<"reactivated" | "follow_up" | "no_action"> {
	// If there's a trigger job ID, check if it's still running
	// For now, if we're here and status is "executing", assume it got stuck

	const timeSinceUpdate = execution.updatedAt
		? Date.now() - new Date(execution.updatedAt).getTime()
		: Number.POSITIVE_INFINITY;

	// If more than 1 hour since last update, assume stuck
	if (timeSinceUpdate > 60 * 60 * 1000) {
		logger.info("Execution appears stuck, resuming", {
			executionId: execution.id,
			currentStepIndex: execution.currentStepIndex,
		});

		await executeAgentTaskPlanJob.trigger({
			executionId: execution.id,
			taskId: execution.taskId,
			teamId: execution.teamId,
			resumeFromStep: execution.currentStepIndex ?? 0,
		});

		return "reactivated";
	}

	return "no_action";
}

/**
 * Manual trigger to check a specific task execution
 */
export const checkAgentTaskExecution = schemaTask({
	id: "check-agent-task-execution",
	schema: z.object({
		taskId: z.string(),
		teamId: z.string(),
	}),
	run: async (payload) => {
		const { taskId } = payload;

		const execution = await getTaskExecutionById(taskId);
		if (!execution) {
			return { status: "not_found" };
		}

		const task = await getTaskById(taskId);
		if (!task) {
			return { status: "task_not_found" };
		}

		const systemUser = await getSystemUser();
		if (!systemUser) {
			return { status: "system_user_not_found" };
		}

		const result = await processExecution(execution);
		return { status: "processed", result };
	},
});
