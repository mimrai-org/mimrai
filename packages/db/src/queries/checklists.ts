import { and, asc, eq, type SQL, sql } from "drizzle-orm";
import { db } from "../index";
import { checklistItems, tasks, users } from "../schema";
import { createChecklistItemActivity } from "./activities";
import {
	triggerAgentOnChecklistComplete,
	triggerAgentOnChecklistItemAssignment,
} from "./agent-triggers";

export const createChecklistItem = async ({
	taskId,
	description,
	assigneeId,
	attachments,
	teamId,
	userId,
}: {
	taskId?: string;
	teamId: string;
	description: string;
	assigneeId?: string;
	userId?: string;
	attachments?: string[];
}) => {
	const [nextOrder] = await db
		.select({
			maxOrder: sql<number>`COALESCE(MAX("order"), 0) + 1`,
		})
		.from(checklistItems)
		.where(eq(checklistItems.teamId, teamId))
		.limit(1);

	const [item] = await db
		.insert(checklistItems)
		.values({
			taskId,
			teamId,
			description,
			assigneeId,
			attachments,
			order: nextOrder?.maxOrder ?? 1,
		})
		.returning();

	if (!item) {
		throw new Error("Failed to create checklist item");
	}

	createChecklistItemActivity({
		checklistItem: item,
		userId,
	});

	// If checklist item is assigned to an agent, trigger agent execution
	if (assigneeId && taskId) {
		// Get the task's assignee to compare
		const [task] = await db
			.select({ assigneeId: tasks.assigneeId })
			.from(tasks)
			.where(eq(tasks.id, taskId))
			.limit(1);

		triggerAgentOnChecklistItemAssignment({
			taskId,
			teamId,
			checklistItemId: item.id,
			assigneeId,
			taskAssigneeId: task?.assigneeId,
			assignedByUserId: userId,
		});
	}

	return item;
};

export const getChecklistItems = async ({
	taskId,
	teamId,
	search,
}: {
	taskId?: string;
	teamId?: string;
	search?: string;
}) => {
	const whereClause: SQL[] = [];
	if (taskId) {
		whereClause.push(eq(checklistItems.taskId, taskId));
	}
	if (teamId) {
		whereClause.push(eq(checklistItems.teamId, teamId));
	}

	if (search) {
		whereClause.push(sql`${checklistItems.description} ILIKE %${search}%`);
	}

	const data = await db
		.select({
			id: checklistItems.id,
			taskId: checklistItems.taskId,
			description: checklistItems.description,
			assigneeId: checklistItems.assigneeId,
			order: checklistItems.order,
			createdAt: checklistItems.createdAt,
			updatedAt: checklistItems.updatedAt,
			isCompleted: checklistItems.isCompleted,
			attachments: checklistItems.attachments,
			assignee: {
				id: users.id,
				name: users.name,
				email: users.email,
				image: users.image,
				color: users.color,
			},
		})
		.from(checklistItems)
		.where(and(...whereClause))
		.leftJoin(users, eq(checklistItems.assigneeId, users.id))
		.orderBy(asc(checklistItems.order))
		.limit(100);

	return data;
};

export const updateChecklistItem = async ({
	id,
	description,
	assigneeId,
	isCompleted,
	attachments,
	userId,
	teamId,
}: {
	id: string;
	description?: string;
	assigneeId?: string;
	isCompleted?: boolean;
	attachments?: string[];
	userId?: string;
	teamId?: string;
}) => {
	const whereClause: SQL[] = [eq(checklistItems.id, id)];
	if (teamId) {
		whereClause.push(eq(checklistItems.teamId, teamId));
	}

	const [oldItem] = await db
		.select()
		.from(checklistItems)
		.where(and(...whereClause));

	if (!oldItem) {
		throw new Error("Checklist item not found");
	}

	const [item] = await db
		.update(checklistItems)
		.set({
			description,
			assigneeId,
			isCompleted,
			attachments,
			updatedAt: new Date().toISOString(),
		})
		.where(and(...whereClause))
		.returning();

	if (!item) {
		throw new Error("Checklist item not found");
	}

	createChecklistItemActivity({
		checklistItem: item,
		oldChecklistItem: oldItem,
		userId,
	});

	// If checklist item was just completed and belongs to a task,
	// check if we should trigger agent re-evaluation
	if (
		isCompleted === true &&
		oldItem.isCompleted !== true &&
		item.taskId &&
		teamId
	) {
		triggerAgentOnChecklistComplete({
			taskId: item.taskId as string,
			teamId,
			checklistItemId: item.id,
			completedByUserId: userId,
		});
	}

	// If assignee changed and the new assignee is an agent, trigger agent execution
	if (
		assigneeId &&
		assigneeId !== oldItem.assigneeId &&
		item.taskId &&
		teamId
	) {
		// Get the task's assignee to compare
		const [task] = await db
			.select({ assigneeId: tasks.assigneeId })
			.from(tasks)
			.where(eq(tasks.id, item.taskId))
			.limit(1);

		triggerAgentOnChecklistItemAssignment({
			taskId: item.taskId,
			teamId,
			checklistItemId: item.id,
			assigneeId,
			taskAssigneeId: task?.assigneeId,
			assignedByUserId: userId,
		});
	}

	return item;
};

export const deleteChecklistItem = async ({
	id,
	teamId,
}: {
	id: string;
	teamId?: string;
}) => {
	const whereClause: SQL[] = [eq(checklistItems.id, id)];
	if (teamId) {
		whereClause.push(eq(checklistItems.teamId, teamId));
	}
	await db.delete(checklistItems).where(and(...whereClause));
};
