import { and, asc, eq, is, or, type SQL, sql } from "drizzle-orm";
import { db } from "../index";
import { checklistItems, users } from "../schema";
import { createChecklistItemActivity } from "./activities";

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
