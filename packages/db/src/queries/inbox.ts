import {
	and,
	desc,
	eq,
	getTableColumns,
	inArray,
	type SQL,
	sql,
} from "drizzle-orm";
import { db } from "..";
import { inbox, users } from "../schema";
import { type CreateTaskInput, createTask } from "./tasks";

export const createInbox = async (input: {
	userId: string;
	teamId: string;
	assigneeId?: string;
	reasoning?: string;
	display: string;
	source: string;
	sourceId: string;
	metadata?: Record<string, any>;
	payload: CreateTaskInput;
}) => {
	const [existing] = await db
		.select()
		.from(inbox)
		.where(
			and(
				eq(inbox.userId, input.userId),
				eq(inbox.teamId, input.teamId),
				eq(inbox.source, input.source),
				eq(inbox.sourceId, input.sourceId),
			),
		)
		.limit(1);

	if (existing) {
		return existing;
	}

	const [inboxItem] = await db
		.insert(inbox)
		.values({
			...input,
		})
		.returning();

	if (!inboxItem) {
		throw new Error("Failed to create inbox item");
	}

	return inboxItem;
};

export const getInboxById = async ({
	id,
	userId,
	teamId,
}: {
	id: string;
	userId?: string;
	teamId?: string;
}) => {
	const whereClause: SQL[] = [eq(inbox.id, id)];
	userId && whereClause.push(eq(inbox.userId, userId));
	teamId && whereClause.push(eq(inbox.teamId, teamId));

	const [inboxItem] = await db
		.select({
			...getTableColumns(inbox),
			assignee: {
				id: users.id,
				name: users.name,
				email: users.email,
				image: users.image,
				color: users.color,
			},
		})
		.from(inbox)
		.leftJoin(users, eq(inbox.assigneeId, users.id))
		.where(and(...whereClause))
		.limit(1);

	return inboxItem;
};

export const getInbox = async ({
	userId,
	teamId,
	pageSize = 20,
	status,
	seen,
	cursor,
}: {
	userId?: string;
	teamId?: string;
	pageSize?: number;
	cursor?: string;
	status?: ("archived" | "accepted" | "dismissed" | "pending")[];
	seen?: boolean;
}) => {
	const whereClause: SQL[] = [];
	userId && whereClause.push(eq(inbox.userId, userId));
	teamId && whereClause.push(eq(inbox.teamId, teamId));
	if (status && status.length > 0) {
		whereClause.push(inArray(inbox.status, status));
	}
	if (seen !== undefined) {
		whereClause.push(eq(inbox.seen, seen));
	}

	const query = db
		.select({
			...getTableColumns(inbox),
			assignee: {
				id: users.id,
				name: users.name,
				email: users.email,
				image: users.image,
				color: users.color,
			},
		})
		.from(inbox)
		.leftJoin(users, eq(inbox.assigneeId, users.id))
		.where(and(...whereClause))
		.orderBy(desc(inbox.createdAt));

	// Apply pagination
	const offset = cursor ? Number.parseInt(cursor, 10) : 0;
	query.limit(pageSize).offset(offset);

	const data = await query;

	// Calculate next cursor
	const nextCursor =
		data && data.length === pageSize
			? (offset + pageSize).toString()
			: undefined;

	return {
		meta: {
			cursor: nextCursor ?? null,
			hasPreviousPage: offset > 0,
			hasNextPage: data && data.length === pageSize,
		},
		data,
	};
};

export const updateInbox = async ({
	id,
	userId,
	teamId,
	...input
}: {
	id: string;
	display?: string;
	source?: string;
	sourceId?: string;
	seen?: boolean;
	status?: "archived" | "accepted" | "dismissed" | "pending";
	reasoning?: string;
	metadata?: Record<string, any>;
	payload?: CreateTaskInput;
	taskId?: string;
	userId?: string;
	teamId?: string;
}) => {
	const whereClause: SQL[] = [eq(inbox.id, id)];
	userId && whereClause.push(eq(inbox.userId, userId));
	teamId && whereClause.push(eq(inbox.teamId, teamId));

	const [inboxItem] = await db
		.update(inbox)
		.set({
			...input,
		})
		.where(and(...whereClause))
		.returning();

	if (!inboxItem) {
		throw new Error("Failed to update inbox item");
	}

	return inboxItem;
};

export const deleteInbox = async ({
	id,
	userId,
	teamId,
}: {
	id: string;
	userId?: string;
	teamId?: string;
}) => {
	const whereClause: SQL[] = [eq(inbox.id, id)];
	userId && whereClause.push(eq(inbox.userId, userId));
	teamId && whereClause.push(eq(inbox.teamId, teamId));

	const [inboxItem] = await db
		.delete(inbox)
		.where(and(...whereClause))
		.returning();

	if (!inboxItem) {
		throw new Error("Failed to delete inbox item");
	}

	return inboxItem;
};

export const acceptInbox = async ({
	id,
	userId,
	teamId,
}: {
	id: string;
	userId?: string;
	teamId?: string;
}) => {
	const existing = await getInboxById({ id, userId, teamId });
	if (!existing) {
		throw new Error("Inbox item not found");
	}

	if (existing.status === "accepted") {
		return existing;
	}

	const task = await createTask({
		userId: existing.userId,
		teamId: existing.teamId,
		statusId: existing.payload.statusId,
		title: existing.payload.title,
		description: existing.payload.description,
		dueDate: existing.payload.dueDate,
		priority: existing.payload.priority,
		assigneeId: existing.payload.assigneeId,
	});

	const inboxItem = await updateInbox({
		id,
		userId,
		teamId,
		taskId: task.id,
		status: "accepted",
	});

	return inboxItem;
};
