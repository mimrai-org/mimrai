import { and, eq, inArray, isNull, lte, or, type SQL } from "drizzle-orm";
import { db } from "..";
import {
	type TaskExecutionMemory,
	type TaskExecutionPlanStep,
	type taskExecutionStatusEnum,
	taskExecutions,
} from "../schema";

export type TaskExecutionStatus =
	(typeof taskExecutionStatusEnum.enumValues)[number];

export interface CreateTaskExecutionInput {
	taskId: string;
	teamId: string;
}

export interface UpdateTaskExecutionInput {
	id: string;
	status?: TaskExecutionStatus;
	plan?: TaskExecutionPlanStep[];
	currentStepIndex?: number;
	memory?: TaskExecutionMemory;
	confirmationRequestedAt?: Date | null;
	confirmationCommentId?: string | null;
	triggerJobId?: string | null;
	nextCheckAt?: Date | null;
	retryCount?: number;
	lastError?: string | null;
	startedAt?: Date | null;
	completedAt?: Date | null;
}

/**
 * Create a new task execution record
 */
export const createTaskExecution = async (input: CreateTaskExecutionInput) => {
	// Check if there's already an active execution for this task
	const existing = await getActiveTaskExecution(input.taskId);
	if (existing) {
		// Return existing if not in a terminal state
		if (!["completed", "failed"].includes(existing.status)) {
			return existing;
		}
		// Delete the old completed/failed execution to create a new one
		await deleteTaskExecution(existing.id);
	}

	const [execution] = await db
		.insert(taskExecutions)
		.values({
			taskId: input.taskId,
			teamId: input.teamId,
			status: "pending",
			plan: [],
			memory: {},
		})
		.returning();

	return execution;
};

/**
 * Get a task execution by ID
 */
export const getTaskExecutionById = async (id: string) => {
	const [execution] = await db
		.select()
		.from(taskExecutions)
		.where(eq(taskExecutions.id, id))
		.limit(1);

	return execution ?? null;
};

/**
 * Get the active task execution for a task
 */
export const getActiveTaskExecution = async (taskId: string) => {
	const [execution] = await db
		.select()
		.from(taskExecutions)
		.where(eq(taskExecutions.taskId, taskId))
		.limit(1);

	return execution ?? null;
};

/**
 * Get all task executions for a team
 */
export const getTaskExecutionsByTeamId = async (teamId: string) => {
	return await db
		.select()
		.from(taskExecutions)
		.where(eq(taskExecutions.teamId, teamId));
};

/**
 * Get task executions that need follow-up checks
 */
export const getTaskExecutionsNeedingCheck = async (beforeDate?: Date) => {
	const conditions: SQL[] = [
		// Not in terminal states
		inArray(taskExecutions.status, [
			"pending",
			"analyzing",
			"planning",
			"awaiting_confirmation",
			"executing",
			"blocked",
		]),
	];

	if (beforeDate) {
		conditions.push(
			or(
				lte(taskExecutions.nextCheckAt, beforeDate),
				isNull(taskExecutions.nextCheckAt),
			)!,
		);
	}

	return await db
		.select()
		.from(taskExecutions)
		.where(and(...conditions));
};

/**
 * Get task executions awaiting confirmation
 */
export const getTaskExecutionsAwaitingConfirmation = async (
	teamId?: string,
) => {
	const conditions: SQL[] = [
		eq(taskExecutions.status, "awaiting_confirmation"),
	];

	if (teamId) {
		conditions.push(eq(taskExecutions.teamId, teamId));
	}

	return await db
		.select()
		.from(taskExecutions)
		.where(and(...conditions));
};

/**
 * Update a task execution
 */
export const updateTaskExecution = async ({
	id,
	...input
}: UpdateTaskExecutionInput) => {
	const [execution] = await db
		.update(taskExecutions)
		.set({
			...input,
			updatedAt: new Date().toISOString(),
		})
		.where(eq(taskExecutions.id, id))
		.returning();

	return execution ?? null;
};

/**
 * Update task execution status
 */
export const updateTaskExecutionStatus = async (
	id: string,
	status: TaskExecutionStatus,
	additionalFields?: Partial<UpdateTaskExecutionInput>,
) => {
	return updateTaskExecution({
		id,
		status,
		...additionalFields,
	});
};

/**
 * Update task execution plan
 */
export const updateTaskExecutionPlan = async (
	id: string,
	plan: TaskExecutionPlanStep[],
) => {
	return updateTaskExecution({ id, plan });
};

/**
 * Update a specific plan step
 */
export const updateTaskExecutionPlanStep = async (
	executionId: string,
	stepId: string,
	updates: Partial<TaskExecutionPlanStep>,
) => {
	const execution = await getTaskExecutionById(executionId);
	if (!execution) return null;

	const updatedPlan = (execution.plan ?? []).map((step) =>
		step.id === stepId ? { ...step, ...updates } : step,
	);

	return updateTaskExecution({ id: executionId, plan: updatedPlan });
};

/**
 * Confirm plan steps (for batch confirmation)
 */
export const confirmPlanSteps = async (
	executionId: string,
	stepIds: string[],
	confirmed: boolean,
) => {
	const execution = await getTaskExecutionById(executionId);
	if (!execution) return null;

	const updatedPlan = (execution.plan ?? []).map((step) => {
		if (stepIds.includes(step.id)) {
			return {
				...step,
				status: confirmed ? ("confirmed" as const) : ("rejected" as const),
			};
		}
		return step;
	});

	// Check if all high-risk steps are now confirmed or rejected
	const highRiskSteps = updatedPlan.filter((s) => s.riskLevel === "high");
	const allHighRiskResolved = highRiskSteps.every(
		(s) => s.status === "confirmed" || s.status === "rejected",
	);

	return updateTaskExecution({
		id: executionId,
		plan: updatedPlan,
		// Move to executing if all confirmations are resolved
		status: allHighRiskResolved ? "executing" : "awaiting_confirmation",
	});
};

/**
 * Update task execution memory
 */
export const updateTaskExecutionMemory = async (
	id: string,
	memoryUpdates: Partial<TaskExecutionMemory>,
) => {
	const execution = await getTaskExecutionById(id);
	if (!execution) return null;

	const updatedMemory: TaskExecutionMemory = {
		...(execution.memory ?? {}),
		...memoryUpdates,
	};

	return updateTaskExecution({ id, memory: updatedMemory });
};

/**
 * Add a Q&A pair to execution memory
 */
export const addQuestionToMemory = async (
	executionId: string,
	question: string,
) => {
	const execution = await getTaskExecutionById(executionId);
	if (!execution) return null;

	const qaPairs = execution.memory?.qaPairs ?? [];
	qaPairs.push({
		question,
		askedAt: new Date().toISOString(),
	});

	return updateTaskExecutionMemory(executionId, { qaPairs });
};

/**
 * Record an answer to a question in memory
 */
export const recordAnswerInMemory = async (
	executionId: string,
	questionIndex: number,
	answer: string,
) => {
	const execution = await getTaskExecutionById(executionId);
	if (!execution) return null;

	const qaPairs = [...(execution.memory?.qaPairs ?? [])];
	if (qaPairs[questionIndex]) {
		qaPairs[questionIndex] = {
			...qaPairs[questionIndex],
			answer,
			answeredAt: new Date().toISOString(),
		};
	}

	return updateTaskExecutionMemory(executionId, { qaPairs });
};

/**
 * Add a human subtask to memory
 */
export const addHumanSubtaskToMemory = async (
	executionId: string,
	subtask: {
		checklistItemId: string;
		description: string;
		assigneeId: string;
	},
) => {
	const execution = await getTaskExecutionById(executionId);
	if (!execution) return null;

	const humanSubtasks = execution.memory?.humanSubtasks ?? [];
	humanSubtasks.push({
		...subtask,
		completed: false,
	});

	return updateTaskExecutionMemory(executionId, { humanSubtasks });
};

/**
 * Mark a human subtask as completed
 */
export const markHumanSubtaskCompleted = async (
	executionId: string,
	checklistItemId: string,
) => {
	const execution = await getTaskExecutionById(executionId);
	if (!execution) return null;

	const humanSubtasks = (execution.memory?.humanSubtasks ?? []).map((st) =>
		st.checklistItemId === checklistItemId ? { ...st, completed: true } : st,
	);

	return updateTaskExecutionMemory(executionId, { humanSubtasks });
};

/**
 * Delete a task execution
 */
export const deleteTaskExecution = async (id: string) => {
	const [deleted] = await db
		.delete(taskExecutions)
		.where(eq(taskExecutions.id, id))
		.returning();

	return deleted ?? null;
};

/**
 * Delete task execution by task ID
 */
export const deleteTaskExecutionByTaskId = async (taskId: string) => {
	const [deleted] = await db
		.delete(taskExecutions)
		.where(eq(taskExecutions.taskId, taskId))
		.returning();

	return deleted ?? null;
};

/**
 * Check if a task has an active execution
 */
export const hasActiveExecution = async (taskId: string) => {
	const execution = await getActiveTaskExecution(taskId);
	if (!execution) return false;
	return !["completed", "failed"].includes(execution.status);
};
