import type { ProjectManagerTrigger } from "@api/ai/agents/project-manager";
import { db } from "@mimir/db/client";
import { isSystemUser } from "@mimir/db/queries/agent-triggers";
import { statuses, tasks } from "@mimir/db/schema";
import { and, eq } from "drizzle-orm";

/**
 * Project Manager Agent — Trigger decision functions
 *
 * These pure-ish functions determine whether the PM agent should be invoked
 * based on events in the system (status changes, comments, completions).
 * They do NOT invoke the PM agent directly — they return a trigger payload
 * or null if no invocation is needed.
 *
 * The caller is responsible for dispatching the job using the returned trigger.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PMTriggerResult {
	/** The project ID the PM agent should manage */
	projectId: string;
	/** The team ID */
	teamId: string;
	/** The trigger payload to pass to the PM agent */
	trigger: ProjectManagerTrigger;
}

// ─── Status change triggers ────────────────────────────────────────────────

/**
 * Evaluate whether a task status change should invoke the PM agent.
 *
 * Triggers when:
 * 1. Task moves to "review" status → PM reviews the work
 * 2. Task moves to "done" AND no "review" status exists → PM re-scopes
 * 3. Task moves to "done" (regardless) → PM assesses milestone impact
 *
 * Does NOT trigger when:
 * - Task has no project
 * - Status change was made by the PM agent itself
 * - Task moves to backlog/to_do (routine status changes)
 */
export async function evaluateTaskStatusChange({
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
}): Promise<PMTriggerResult | null> {
	// Fetch task with project info
	const [task] = await db
		.select({
			id: tasks.id,
			title: tasks.title,
			projectId: tasks.projectId,
			assigneeId: tasks.assigneeId,
		})
		.from(tasks)
		.where(and(eq(tasks.id, taskId), eq(tasks.teamId, teamId)))
		.limit(1);

	if (!task?.projectId) {
		return null; // No project = no PM to notify
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
		return null;
	}

	// Task moved to "review" → PM should review
	if (newStatus.type === "review") {
		return {
			projectId: task.projectId,
			teamId,
			trigger: {
				type: "task_status_changed",
				taskId: task.id,
				oldStatus: oldStatus.name,
				newStatus: newStatus.name,
				newStatusType: newStatus.type,
			},
		};
	}

	// Task moved to "done" → PM should re-scope
	if (newStatus.type === "done") {
		// Check if a "review" status exists for this team
		const reviewStatuses = await db
			.select({ id: statuses.id })
			.from(statuses)
			.where(and(eq(statuses.teamId, teamId), eq(statuses.type, "review")))
			.limit(1);

		const hasReviewStatus = reviewStatuses.length > 0;

		if (!hasReviewStatus) {
			// No review status → PM should handle the "done" as a review + completion
			return {
				projectId: task.projectId,
				teamId,
				trigger: {
					type: "task_completed",
					taskId: task.id,
					taskTitle: task.title,
				},
			};
		}

		// Review status exists → PM still gets notified of completion for re-scoping
		return {
			projectId: task.projectId,
			teamId,
			trigger: {
				type: "task_completed",
				taskId: task.id,
				taskTitle: task.title,
			},
		};
	}

	return null; // Other status changes don't trigger PM
}

// ─── Mention triggers ──────────────────────────────────────────────────────

/**
 * Evaluate whether a comment mention should invoke the PM agent.
 *
 * Triggers when:
 * - A comment mentions the PM agent's user ID
 *
 * Does NOT trigger when:
 * - Task has no project
 * - The mention is from the PM agent itself
 * - The mentioned user is not a system user (agent)
 *
 * Note: When a human is mentioned, the system should NOT auto-respond —
 * the caller should wait for the human to respond naturally.
 */
export async function evaluateCommentMention({
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
}): Promise<PMTriggerResult | null> {
	// Check if the mentioned user is an agent (system user)
	const isMentionedAgent = await isSystemUser(mentionedUserId);
	if (!isMentionedAgent) {
		return null; // Mentioned a human — wait for human response
	}

	// Prevent self-triggering
	if (mentionedUserId === commentByUserId) {
		return null;
	}

	// Fetch task to get project association
	const [task] = await db
		.select({
			id: tasks.id,
			projectId: tasks.projectId,
		})
		.from(tasks)
		.where(and(eq(tasks.id, taskId), eq(tasks.teamId, teamId)))
		.limit(1);

	if (!task?.projectId) {
		return null; // No project context for PM
	}

	return {
		projectId: task.projectId,
		teamId,
		trigger: {
			type: "agent_mention",
			taskId: task.id,
			mentionedByUserId: commentByUserId,
			mentionedByUserName: commentByUserName,
			message: commentText,
		},
	};
}

// ─── Milestone completion trigger ──────────────────────────────────────────

/**
 * Check if a milestone is fully completed (all tasks done) after a task completion.
 * If so, return a milestone_completed trigger for the PM agent.
 */
export async function evaluateMilestoneCompletion({
	taskId,
	teamId,
}: {
	taskId: string;
	teamId: string;
}): Promise<PMTriggerResult | null> {
	// Get the task's milestone and project
	const [task] = await db
		.select({
			milestoneId: tasks.milestoneId,
			projectId: tasks.projectId,
		})
		.from(tasks)
		.where(and(eq(tasks.id, taskId), eq(tasks.teamId, teamId)))
		.limit(1);

	if (!task?.milestoneId || !task?.projectId) {
		return null;
	}

	// Check if all tasks in this milestone are done
	const milestoneTasks = await db
		.select({
			taskId: tasks.id,
			statusType: statuses.type,
		})
		.from(tasks)
		.innerJoin(statuses, eq(tasks.statusId, statuses.id))
		.where(
			and(eq(tasks.milestoneId, task.milestoneId), eq(tasks.teamId, teamId)),
		);

	const allDone = milestoneTasks.every(
		(t) => t.statusType === "done" || t.statusType === "review",
	);

	if (!allDone || milestoneTasks.length === 0) {
		return null;
	}

	// Fetch milestone name
	const { milestones } = await import("@mimir/db/schema");
	const [milestone] = await db
		.select({ id: milestones.id, name: milestones.name })
		.from(milestones)
		.where(eq(milestones.id, task.milestoneId))
		.limit(1);

	if (!milestone) {
		return null;
	}

	return {
		projectId: task.projectId,
		teamId,
		trigger: {
			type: "milestone_completed",
			milestoneId: milestone.id,
			milestoneName: milestone.name,
		},
	};
}

// ─── Project creation trigger ──────────────────────────────────────────────

/**
 * Trigger the PM agent when a new project is created with milestones.
 * The PM will analyze the project and create initial tasks.
 */
export function buildProjectCreatedTrigger({
	projectId,
	teamId,
}: {
	projectId: string;
	teamId: string;
}): PMTriggerResult {
	return {
		projectId,
		teamId,
		trigger: { type: "project_created" },
	};
}

// ─── Manual trigger ────────────────────────────────────────────────────────

/**
 * Build a manual trigger for the PM agent (e.g., from a user action or API call).
 */
export function buildManualPMTrigger({
	projectId,
	teamId,
	instruction,
}: {
	projectId: string;
	teamId: string;
	instruction?: string;
}): PMTriggerResult {
	return {
		projectId,
		teamId,
		trigger: { type: "manual", instruction },
	};
}

// ─── Compound evaluation ───────────────────────────────────────────────────

/**
 * After a task moves to "done", evaluate BOTH task completion AND milestone completion.
 * Returns up to 2 triggers (one for task completion re-scope, one for milestone if fully done).
 * The caller should dispatch both if both are returned.
 */
export async function evaluateTaskCompletion({
	taskId,
	teamId,
	oldStatusId,
	newStatusId,
	changedByUserId,
}: {
	taskId: string;
	teamId: string;
	oldStatusId: string;
	newStatusId: string;
	changedByUserId?: string;
}): Promise<PMTriggerResult[]> {
	const results: PMTriggerResult[] = [];

	// First evaluate the status change itself
	const statusTrigger = await evaluateTaskStatusChange({
		taskId,
		teamId,
		oldStatusId,
		newStatusId,
		changedByUserId,
	});

	if (statusTrigger) {
		results.push(statusTrigger);
	}

	// Then check if this completion finishes a milestone
	const milestoneTrigger = await evaluateMilestoneCompletion({
		taskId,
		teamId,
	});
	if (milestoneTrigger) {
		results.push(milestoneTrigger);
	}

	return results;
}
