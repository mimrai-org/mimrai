import { systemUserCache } from "@mimir/cache/system-user-cache";
import { tasks as triggerTasks } from "@trigger.dev/sdk";
import { and, eq } from "drizzle-orm";
import { db } from "../index";
import { checklistItems, projects, statuses, tasks, users } from "../schema";

const AGENT_TASK_JOB_ID = "execute-agent-task-plan";
const PM_AGENT_JOB_ID = "execute-pm-agent";

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

	// Prevent self triggering if the comment by the agent itself commented
	if (
		triggerUserId &&
		triggerUserId === assigneeId &&
		triggeredBy === "comment"
	) {
		return false;
	}

	// Prevent triggering on updates that are not new assignments (e.g. status change, title change)
	if (
		triggerUserId &&
		triggerUserId === assigneeId &&
		triggeredBy === "update"
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

// ─── Project Manager Agent Triggers ─────────────────────────────────────────

/**
 * Trigger the PM agent when a task's status changes within a project.
 *
 * Invokes the PM agent when:
 * - Task moves to "review" → PM reviews the work
 * - Task moves to "done" → PM re-scopes and checks milestone progress
 *
 * Does NOT trigger for other status transitions (backlog, to_do, in_progress).
 */
export const triggerPMAgentOnStatusChange = async ({
	taskId,
	teamId,
	oldStatusId,
	newStatusId,
}: {
	taskId: string;
	teamId: string;
	oldStatusId: string;
	newStatusId: string;
	changedByUserId?: string;
}): Promise<boolean> => {
	// Fetch task with project info
	const [task] = await db
		.select({
			id: tasks.id,
			title: tasks.title,
			projectId: tasks.projectId,
			milestoneId: tasks.milestoneId,
		})
		.from(tasks)
		.where(and(eq(tasks.id, taskId), eq(tasks.teamId, teamId)))
		.limit(1);

	if (!task?.projectId) {
		return false; // No project = no PM to notify
	}

	// Fetch old and new status details
	const [oldStatus, newStatus] = await Promise.all([
		db
			.select({ id: statuses.id, name: statuses.name, type: statuses.type })
			.from(statuses)
			.where(eq(statuses.id, oldStatusId))
			.limit(1)
			.then((r) => r[0]),
		db
			.select({ id: statuses.id, name: statuses.name, type: statuses.type })
			.from(statuses)
			.where(eq(statuses.id, newStatusId))
			.limit(1)
			.then((r) => r[0]),
	]);

	if (!oldStatus || !newStatus) {
		return false;
	}

	// Only trigger for review or done transitions
	if (newStatus.type !== "review" && newStatus.type !== "done") {
		return false;
	}

	// Build the trigger payload
	const trigger =
		newStatus.type === "done"
			? {
					type: "task_completed" as const,
					taskId: task.id,
					taskTitle: task.title,
				}
			: {
					type: "task_status_changed" as const,
					taskId: task.id,
					oldStatus: oldStatus.name,
					newStatus: newStatus.name,
					newStatusType: newStatus.type!,
				};

	await triggerTasks.trigger(
		PM_AGENT_JOB_ID,
		{
			projectId: task.projectId,
			teamId,
			trigger,
		},
		{
			idempotencyKey: `pm-status-${taskId}-${newStatusId}-${Date.now()}`,
			tags: [
				`projectId:${task.projectId}`,
				`teamId:${teamId}`,
				`trigger:${trigger.type}`,
				`taskId:${taskId}`,
			],
		},
	);

	// If the task completed and has a milestone, check if milestone is fully done
	if (newStatus.type === "done" && task.milestoneId) {
		await triggerPMAgentOnMilestoneCompletion({
			taskId,
			teamId,
			projectId: task.projectId,
			milestoneId: task.milestoneId,
		});
	}

	return true;
};

/**
 * Check if a milestone is fully completed after a task finishes,
 * and trigger the PM agent with a milestone_completed event if so.
 */
const triggerPMAgentOnMilestoneCompletion = async ({
	teamId,
	projectId,
	milestoneId,
}: {
	taskId: string;
	teamId: string;
	projectId: string;
	milestoneId: string;
}): Promise<boolean> => {
	// Check if all tasks in this milestone are done
	const milestoneTasks = await db
		.select({
			taskId: tasks.id,
			statusType: statuses.type,
		})
		.from(tasks)
		.innerJoin(statuses, eq(tasks.statusId, statuses.id))
		.where(and(eq(tasks.milestoneId, milestoneId), eq(tasks.teamId, teamId)));

	const allDone =
		milestoneTasks.length > 0 &&
		milestoneTasks.every((t) => t.statusType === "done");

	if (!allDone) {
		return false;
	}

	// Fetch milestone name
	const { milestones } = await import("../schema");
	const [milestone] = await db
		.select({ id: milestones.id, name: milestones.name })
		.from(milestones)
		.where(eq(milestones.id, milestoneId))
		.limit(1);

	if (!milestone) {
		return false;
	}

	await triggerTasks.trigger(
		PM_AGENT_JOB_ID,
		{
			projectId,
			teamId,
			trigger: {
				type: "milestone_completed" as const,
				milestoneId: milestone.id,
				milestoneName: milestone.name,
			},
		},
		{
			idempotencyKey: `pm-milestone-${milestoneId}-${Date.now()}`,
			tags: [
				`projectId:${projectId}`,
				`teamId:${teamId}`,
				"trigger:milestone_completed",
				`milestoneId:${milestoneId}`,
			],
		},
	);

	return true;
};

/**
 * Trigger the PM agent when an agent is mentioned in a task comment.
 * This allows agents working on tasks to ask the PM agent questions by mentioning it.
 *
 * If the mentioned user is a human (not a system user), returns false — the system
 * should wait for the human to respond naturally.
 */
export const triggerPMAgentOnMention = async ({
	taskId,
	teamId,
	mentionedUserId,
	commentByUserId,
	commentByUserName,
	commentText,
}: {
	taskId: string;
	teamId: string;
	mentionedUserId: string;
	commentByUserId: string;
	commentByUserName: string;
	commentText: string;
}): Promise<boolean> => {
	// Only trigger if mention is for an agent (system user)
	const isMentionedAgent = await isSystemUser(mentionedUserId);
	if (!isMentionedAgent) {
		return false; // Mentioned a human — wait for human response
	}

	// Prevent self-triggering
	if (mentionedUserId === commentByUserId) {
		return false;
	}

	// Fetch task to get project association
	const [task] = await db
		.select({
			id: tasks.id,
			projectId: tasks.projectId,
			projectLeadId: projects.leadId,
		})
		.from(tasks)
		.innerJoin(projects, eq(tasks.projectId, projects.id))
		.where(and(eq(tasks.id, taskId), eq(tasks.teamId, teamId)))
		.limit(1);

	if (!task?.projectId) {
		return false; // No project = no PM context
	}

	// The commenter is yourself, don't trigger. This can happen when the PM agent comments and mentions otherselves for follow-up actions. We want to avoid infinite loops.
	if (task.projectLeadId === commentByUserId) {
		return false;
	}

	await triggerTasks.trigger(
		PM_AGENT_JOB_ID,
		{
			projectId: task.projectId,
			teamId,
			trigger: {
				type: "agent_mention" as const,
				taskId: task.id,
				mentionedByUserId: commentByUserId,
				mentionedByUserName: commentByUserName,
				message: commentText,
			},
		},
		{
			idempotencyKey: `pm-mention-${taskId}-${Date.now()}`,
			tags: [
				`projectId:${task.projectId}`,
				`teamId:${teamId}`,
				"trigger:agent_mention",
				`taskId:${taskId}`,
			],
		},
	);

	return true;
};

/**
 * Trigger the PM agent when a new project is created.
 * The PM will analyze the project description, create milestones, breakdown tasks,
 * and kick off the entire planning loop.
 */
export const triggerPMAgentOnProjectCreation = async ({
	projectId,
	teamId,
}: {
	projectId: string;
	teamId: string;
}): Promise<boolean> => {
	await triggerTasks.trigger(
		PM_AGENT_JOB_ID,
		{
			projectId,
			teamId,
			trigger: {
				type: "project_created" as const,
			},
		},
		{
			idempotencyKey: `pm-project-created-${projectId}`,
			tags: [
				`projectId:${projectId}`,
				`teamId:${teamId}`,
				"trigger:project_created",
			],
		},
	);

	return true;
};
