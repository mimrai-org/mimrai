import { agentTaskAssignedJob } from "@jobs/jobs/agent-jobs/agent-task-assigned-job";
import { eq } from "drizzle-orm";
import { db } from "..";
import { users } from "../schema";

/**
 * Check if the given user ID is the system user (agent)
 */
export const isSystemUser = async (
	userId: string | null | undefined,
): Promise<boolean> => {
	if (!userId) return false;

	const [user] = await db
		.select({ isSystemUser: users.isSystemUser })
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);

	return user?.isSystemUser ?? false;
};

/**
 * Trigger agent task execution when a task is assigned to the system user
 * This should be called after task creation or update
 */
export const triggerAgentTaskExecutionIfNeeded = async ({
	taskId,
	teamId,
	assigneeId,
	previousAssigneeId,
	triggeredBy,
	triggerUserId,
}: {
	taskId: string;
	teamId: string;
	assigneeId: string | null | undefined;
	previousAssigneeId?: string | null;
	triggeredBy: "assignment" | "update" | "comment" | "checklist";
	triggerUserId?: string;
}): Promise<boolean> => {
	// Check if the new assignee is an agent
	const isAssignedToAgent = await isSystemUser(assigneeId);

	if (!isAssignedToAgent) {
		return false;
	}

	// For updates, check if this is a new assignment or just an update
	const wasAssignedToAgent = previousAssigneeId
		? await isSystemUser(previousAssigneeId)
		: false;

	// Trigger the job
	await agentTaskAssignedJob.trigger(
		{
			taskId,
			teamId,
			triggeredBy: wasAssignedToAgent ? "update" : "assignment",
			triggerUserId,
		},
		{
			idempotencyKey: `agent-task-${taskId}-${Date.now()}`,
			tags: [`taskId:${taskId}`, `teamId:${teamId}`, `trigger:${triggeredBy}`],
		},
	);

	return true;
};

/**
 * Trigger agent to check on a task when a checklist item is completed
 * Only triggers if the task is assigned to an agent
 */
export const triggerAgentOnChecklistComplete = async ({
	taskId,
	teamId,
	checklistItemId,
	completedByUserId,
}: {
	taskId: string;
	teamId: string;
	checklistItemId: string;
	completedByUserId?: string;
}): Promise<boolean> => {
	// Fetch the task to check if it's assigned to an agent
	const { tasks } = await import("../schema");
	const [task] = await db
		.select({ assigneeId: tasks.assigneeId })
		.from(tasks)
		.where(eq(tasks.id, taskId))
		.limit(1);

	if (!task?.assigneeId) {
		return false;
	}

	const isAssignedToAgent = await isSystemUser(task.assigneeId);
	if (!isAssignedToAgent) {
		return false;
	}

	// Don't trigger if the checklist was completed by agent itself
	if (completedByUserId) {
		const isCompletedByAgent = await isSystemUser(completedByUserId);
		if (isCompletedByAgent) {
			return false;
		}
	}

	await agentTaskAssignedJob.trigger(
		{
			taskId,
			teamId,
			triggeredBy: "checklist",
		},
		{
			idempotencyKey: `agent-checklist-${taskId}-${checklistItemId}`,
			tags: [
				`taskId:${taskId}`,
				`teamId:${teamId}`,
				"trigger:checklist",
				`checklistItemId:${checklistItemId}`,
			],
		},
	);

	return true;
};
