import { eq, sql } from "drizzle-orm";
import { db } from "../index";
import {
	type ProjectExecutionMemory,
	type projectExecutionStatusEnum,
	projectExecutions,
} from "../schema";

export type ProjectExecutionStatus =
	(typeof projectExecutionStatusEnum.enumValues)[number];

export interface CreateProjectExecutionInput {
	projectId: string;
	teamId: string;
}

export interface UpdateProjectExecutionInput {
	projectId: string;
	status?: ProjectExecutionStatus;
	memory?: ProjectExecutionMemory;
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
 * Create a new project execution record.
 * Returns existing record if one already exists for this project.
 */
export const createProjectExecution = async (
	input: CreateProjectExecutionInput,
) => {
	const existing = await getProjectExecution(input.projectId);
	if (existing) {
		return existing;
	}

	const [execution] = await db
		.insert(projectExecutions)
		.values({
			projectId: input.projectId,
			teamId: input.teamId,
			status: "pending",
			memory: {},
		})
		.returning();

	return execution;
};

/**
 * Get project execution by project ID
 */
export const getProjectExecution = async (projectId: string) => {
	const [execution] = await db
		.select()
		.from(projectExecutions)
		.where(eq(projectExecutions.projectId, projectId))
		.limit(1);

	return execution ?? null;
};

/**
 * Get all project executions for a team
 */
export const getProjectExecutionsByTeamId = async (teamId: string) => {
	return await db
		.select()
		.from(projectExecutions)
		.where(eq(projectExecutions.teamId, teamId));
};

/**
 * Update a project execution
 */
export const updateProjectExecution = async ({
	projectId,
	...input
}: UpdateProjectExecutionInput) => {
	const [execution] = await db
		.update(projectExecutions)
		.set({
			...input,
			updatedAt: new Date().toISOString(),
		})
		.where(eq(projectExecutions.projectId, projectId))
		.returning();

	return execution ?? null;
};

/**
 * Update project execution status
 */
export const updateProjectExecutionStatus = async (
	projectId: string,
	status: ProjectExecutionStatus,
	additionalFields?: Partial<UpdateProjectExecutionInput>,
) => {
	return updateProjectExecution({
		projectId,
		status,
		...additionalFields,
	});
};

/**
 * Add usage metrics to a project execution (cumulative)
 */
export const addProjectExecutionUsageMetrics = async (
	projectId: string,
	usageMetrics: {
		inputTokens: number;
		outputTokens: number;
		totalTokens: number;
		costUSD: number;
	},
) => {
	const defaultMetrics = {
		inputTokens: 0,
		outputTokens: 0,
		totalTokens: 0,
		costUSD: 0,
	};

	const [execution] = await db
		.update(projectExecutions)
		.set({
			usageMetrics: sql`jsonb_build_object(
				'inputTokens', COALESCE((COALESCE(${projectExecutions.usageMetrics}, ${JSON.stringify(defaultMetrics)}::jsonb)->>'inputTokens')::numeric, 0) + ${usageMetrics.inputTokens},
				'outputTokens', COALESCE((COALESCE(${projectExecutions.usageMetrics}, ${JSON.stringify(defaultMetrics)}::jsonb)->>'outputTokens')::numeric, 0) + ${usageMetrics.outputTokens},
				'totalTokens', COALESCE((COALESCE(${projectExecutions.usageMetrics}, ${JSON.stringify(defaultMetrics)}::jsonb)->>'totalTokens')::numeric, 0) + ${usageMetrics.totalTokens},
				'costUSD', COALESCE((COALESCE(${projectExecutions.usageMetrics}, ${JSON.stringify(defaultMetrics)}::jsonb)->>'costUSD')::numeric, 0) + ${usageMetrics.costUSD}
			)`,
			updatedAt: new Date().toISOString(),
		})
		.where(eq(projectExecutions.projectId, projectId))
		.returning();

	return execution ?? null;
};

/**
 * Update project execution memory (merge with existing)
 */
export const updateProjectExecutionMemory = async (
	projectId: string,
	memoryUpdates: Partial<ProjectExecutionMemory>,
) => {
	const execution = await getProjectExecution(projectId);
	if (!execution) return null;

	const updatedMemory: ProjectExecutionMemory = {
		...(execution.memory ?? {}),
		...memoryUpdates,
	};

	return updateProjectExecution({ projectId, memory: updatedMemory });
};

/**
 * Delete a project execution
 */
export const deleteProjectExecution = async (projectId: string) => {
	const [deleted] = await db
		.delete(projectExecutions)
		.where(eq(projectExecutions.projectId, projectId))
		.returning();

	return deleted ?? null;
};
