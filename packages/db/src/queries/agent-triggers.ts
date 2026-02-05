import { systemUserCache } from "@mimir/cache/system-user-cache";
import { tasks as triggerTasks } from "@trigger.dev/sdk";
import { and, eq } from "drizzle-orm";
import { db } from "../index";
import { checklistItems, tasks, users } from "../schema";

const AGENT_TASK_JOB_ID = "execute-agent-task-plan";

/**
 * Check if the given user ID is the system user (agent)
 * Results are cached for performance
 */
export const isSystemUser = async (
	userId: string | null | undefined,
): Promise<boolean> => {
	if (!userId) return false;

	// Check cache first
	const cached = await systemUserCache.get(userId);
	if (cached !== undefined) {
		return cached;
	}

	const [user] = await db
		.select({ isSystemUser: users.isSystemUser })
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);

	const result = user?.isSystemUser ?? false;

	// Cache the result
	await systemUserCache.set(userId, result);

	return result;
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
	triggeredBy: "assignment" | "update" | "comment";
	triggerUserId?: string;
}): Promise<boolean> => {
	// Check if the new assignee is an agent
	const isAssignedToAgent = await isSystemUser(assigneeId);

	if (!isAssignedToAgent) {
		return false;
	}

	// Prevent self-triggering if the trigger was done by the agent itself
	if (
		triggerUserId &&
		triggerUserId === assigneeId &&
		triggeredBy === "assignment"
	) {
		return false;
	}

	// For updates, check if this is a new assignment or just an update
	const wasAssignedToAgent = previousAssigneeId
		? await isSystemUser(previousAssigneeId)
		: false;

	if (triggeredBy === "update" && wasAssignedToAgent) {
		return false;
	}

	// Trigger the job by name using trigger.dev SDK
	await triggerTasks.trigger(
		AGENT_TASK_JOB_ID,
		{
			taskId,
			teamId,
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
 * Only triggers if the task is assigned to an agent AND all checklist items
 * assigned to other users (not the task assignee) are completed.
 * This saves tokens by not triggering the task owner agent until all delegated work is done.
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

	// Check if all checklist items NOT assigned to the task assignee are completed
	// This ensures we only trigger the task owner agent when all delegated work is done
	const pendingItemsWithAssignee = await db
		.select({
			id: checklistItems.id,
			assigneeId: checklistItems.assigneeId,
		})
		.from(checklistItems)
		.where(
			and(
				eq(checklistItems.taskId, taskId),
				eq(checklistItems.teamId, teamId),
				eq(checklistItems.isCompleted, false),
			),
		);

	// Check if there are any pending items assigned to someone other than the task assignee
	const hasPendingDelegatedItems = pendingItemsWithAssignee.some(
		(item) => item.assigneeId && item.assigneeId !== task.assigneeId,
	);

	if (hasPendingDelegatedItems) {
		// Don't trigger yet - there are still pending delegated items
		return false;
	}

	await triggerTasks.trigger(
		AGENT_TASK_JOB_ID,
		{
			taskId,
			teamId,
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

/**
 * Trigger agent to resolve a checklist item when it's assigned to an agent
 * This is different from task assignment - it focuses on a specific checklist item
 *
 * @param taskId - The parent task ID
 * @param teamId - The team ID
 * @param checklistItemId - The checklist item being assigned
 * @param assigneeId - The user ID the checklist item is being assigned to
 * @param taskAssigneeId - The task's current assignee ID (to check if different agent)
 * @param assignedByUserId - The user who made the assignment (to prevent self-triggering)
 */
export const triggerAgentOnChecklistItemAssignment = async ({
	taskId,
	teamId,
	checklistItemId,
	assigneeId,
	taskAssigneeId,
	assignedByUserId,
}: {
	taskId: string;
	teamId: string;
	checklistItemId: string;
	assigneeId: string;
	taskAssigneeId?: string | null;
	assignedByUserId?: string;
}): Promise<boolean> => {
	// Check if the assignee is an agent
	const isAssignedToAgent = await isSystemUser(assigneeId);
	if (!isAssignedToAgent) {
		return false;
	}

	// Prevent self-triggering if the assignment was done by the agent itself
	if (assignedByUserId && assignedByUserId === assigneeId) {
		return false;
	}

	// Only trigger if the checklist item assignee is different from the task assignee
	// This ensures we don't double-trigger when the same agent is working on both
	if (taskAssigneeId && taskAssigneeId === assigneeId) {
		return false;
	}

	await triggerTasks.trigger(
		AGENT_TASK_JOB_ID,
		{
			taskId,
			teamId,
			checklistItemId,
		},
		{
			idempotencyKey: `agent-checklist-assign-${checklistItemId}-${Date.now()}`,
			tags: [
				`taskId:${taskId}`,
				`teamId:${teamId}`,
				"trigger:checklist-assignment",
				`checklistItemId:${checklistItemId}`,
				`assigneeId:${assigneeId}`,
			],
		},
	);

	return true;
};
