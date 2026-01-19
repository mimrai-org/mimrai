import { and, desc, eq, getTableColumns, inArray, type SQL } from "drizzle-orm";
import { db } from "..";
import { intakes, users } from "../schema";
import { type CreateTaskInput, createTask } from "./tasks";

export const createIntake = async (input: {
	userId: string;
	teamId: string;
	inboxId?: string;
	assigneeId?: string;
	reasoning?: string;
	source: string;
	sourceId: string;
	payload: CreateTaskInput;
}) => {
	const [intakeItem] = await db
		.insert(intakes)
		.values({
			...input,
		})
		.returning();

	if (!intakeItem) {
		throw new Error("Failed to create intake item");
	}

	return intakeItem;
};

export const getIntakeById = async ({
	id,
	userId,
	teamId,
}: {
	id: string;
	userId?: string;
	teamId?: string;
}) => {
	const whereClause: SQL[] = [eq(intakes.id, id)];
	userId && whereClause.push(eq(intakes.userId, userId));
	teamId && whereClause.push(eq(intakes.teamId, teamId));

	const [intakeItem] = await db
		.select({
			...getTableColumns(intakes),
			assignee: {
				id: users.id,
				name: users.name,
				email: users.email,
				image: users.image,
				color: users.color,
			},
		})
		.from(intakes)
		.leftJoin(users, eq(intakes.assigneeId, users.id))
		.where(and(...whereClause))
		.limit(1);

	return intakeItem;
};

export const getIntakes = async ({
	userId,
	teamId,
	pageSize = 20,
	status,
	cursor,
}: {
	userId?: string;
	teamId?: string;
	pageSize?: number;
	cursor?: string;
	status?: ("accepted" | "dismissed" | "pending")[];
}) => {
	const whereClause: SQL[] = [];
	userId && whereClause.push(eq(intakes.userId, userId));
	teamId && whereClause.push(eq(intakes.teamId, teamId));
	if (status && status.length > 0) {
		whereClause.push(inArray(intakes.status, status));
	}

	const query = db
		.select({
			...getTableColumns(intakes),
			assignee: {
				id: users.id,
				name: users.name,
				email: users.email,
				image: users.image,
				color: users.color,
			},
		})
		.from(intakes)
		.leftJoin(users, eq(intakes.assigneeId, users.id))
		.where(and(...whereClause))
		.orderBy(desc(intakes.createdAt));

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

export const updateIntake = async ({
	id,
	userId,
	teamId,
	...input
}: {
	id: string;
	source?: string;
	sourceId?: string;
	status?: "accepted" | "dismissed" | "pending";
	reasoning?: string;
	payload?: CreateTaskInput;
	taskId?: string;
	userId?: string;
	teamId?: string;
}) => {
	const whereClause: SQL[] = [eq(intakes.id, id)];
	userId && whereClause.push(eq(intakes.userId, userId));
	teamId && whereClause.push(eq(intakes.teamId, teamId));

	const [intakeItem] = await db
		.update(intakes)
		.set({
			...input,
		})
		.where(and(...whereClause))
		.returning();

	if (!intakeItem) {
		throw new Error("Failed to update intake item");
	}

	return intakeItem;
};

export const deleteIntake = async ({
	id,
	userId,
	teamId,
}: {
	id: string;
	userId?: string;
	teamId?: string;
}) => {
	const whereClause: SQL[] = [eq(intakes.id, id)];
	userId && whereClause.push(eq(intakes.userId, userId));
	teamId && whereClause.push(eq(intakes.teamId, teamId));

	const [intakeItem] = await db
		.delete(intakes)
		.where(and(...whereClause))
		.returning();

	if (!intakeItem) {
		throw new Error("Failed to delete intake item");
	}

	return intakeItem;
};

export const acceptIntake = async ({
	id,
	userId,
	teamId,
}: {
	id: string;
	userId?: string;
	teamId?: string;
}) => {
	const existing = await getIntakeById({ id, userId, teamId });
	if (!existing) {
		throw new Error("Intake item not found");
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
		projectId: existing.payload.projectId,
		labels: existing.payload.labels,
	});

	const intakeItem = await updateIntake({
		id,
		userId,
		teamId,
		taskId: task.id,
		status: "accepted",
	});

	return intakeItem;
};
