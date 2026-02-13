import { eq } from "drizzle-orm";
import { db } from "../index";
import {
	type TaskExecutionMemory,
	type taskExecutionStatusEnum,
	taskExecutions,
} from "../schema";
import { getMessages } from "./chats";

export type TaskExecutionStatus =
	(typeof taskExecutionStatusEnum.enumValues)[number];

export interface CreateTaskExecutionInput {
	taskId: string;
	teamId: string;
}

export interface UpdateTaskExecutionInput {
	taskId: string;
	status?: TaskExecutionStatus;
	currentStepIndex?: number;
	memory?: TaskExecutionMemory;
	usageMetrics?: {
		inputTokens: number;
		outputTokens: number;
		totalTokens: number;
		costUSD: number;
	};
	triggerJobId?: string | null;
	contextStale?: boolean;
	lastError?: string | null;
	completedAt?: string | null;
}

/**
 * Create a new task execution record
 */
export const createTaskExecution = async (input: CreateTaskExecutionInput) => {
	// Check if there's already an active execution for this task
	const existing = await getActiveTaskExecution(input.taskId);
	if (existing) {
		return existing;
	}

	const [execution] = await db
		.insert(taskExecutions)
		.values({
			taskId: input.taskId,
			teamId: input.teamId,
			status: "pending",
			memory: {},
		})
		.returning();

	return execution;
};

/**
 * Get a task execution by ID
 */
export const getTaskExecutionByTaskId = async (taskId: string) => {
	const [execution] = await db
		.select()
		.from(taskExecutions)
		.where(eq(taskExecutions.taskId, taskId))
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
 * Update a task execution
 */
export const updateTaskExecution = async ({
	taskId,
	...input
}: UpdateTaskExecutionInput) => {
	const [execution] = await db
		.update(taskExecutions)
		.set({
			...input,
			updatedAt: new Date().toISOString(),
		})
		.where(eq(taskExecutions.taskId, taskId))
		.returning();

	return execution ?? null;
};

/**
 * Update task execution status
 */
export const updateTaskExecutionStatus = async (
	taskId: string,
	status: TaskExecutionStatus,
	additionalFields?: Partial<UpdateTaskExecutionInput>,
) => {
	return updateTaskExecution({
		taskId,
		status,
		...additionalFields,
	});
};

export const addTaskExecutionUsageMetrics = async (
	taskId: string,
	usageMetrics: {
		inputTokens: number;
		outputTokens: number;
		totalTokens: number;
		costUSD: number;
	},
) => {
	const execution = await getTaskExecutionByTaskId(taskId);
	if (!execution) return null;

	const existingMetrics = execution.usageMetrics || {
		inputTokens: 0,
		outputTokens: 0,
		totalTokens: 0,
		costUSD: 0,
	};

	const updatedMetrics = {
		inputTokens: existingMetrics.inputTokens + usageMetrics.inputTokens,
		outputTokens: existingMetrics.outputTokens + usageMetrics.outputTokens,
		totalTokens: existingMetrics.totalTokens + usageMetrics.totalTokens,
		costUSD: existingMetrics.costUSD + usageMetrics.costUSD,
	};

	return updateTaskExecution({
		taskId,
		usageMetrics: updatedMetrics,
	});
};

/**
 * Update task execution memory
 */
export const updateTaskExecutionMemory = async (
	taskId: string,
	memoryUpdates: Partial<TaskExecutionMemory>,
) => {
	const execution = await getTaskExecutionByTaskId(taskId);
	if (!execution) return null;

	const updatedMemory: TaskExecutionMemory = {
		...(execution.memory ?? {}),
		...memoryUpdates,
	};

	return updateTaskExecution({ taskId, memory: updatedMemory });
};

/**
 * Delete a task execution
 */
export const deleteTaskExecution = async (taskId: string) => {
	const [deleted] = await db
		.delete(taskExecutions)
		.where(eq(taskExecutions.taskId, taskId))
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

export const getTaskExecutionLogs = async ({
	taskId,
	teamId,
}: {
	taskId: string;
	teamId: string;
}) => {
	const messages = await getMessages({
		chatId: taskId,
		teamId,
	});

	return messages.flatMap((msg) => {
		return msg.parts;
	});
};
