import { and, eq, ilike, inArray, type SQL } from "drizzle-orm";
import type {
	CreateTaskInput,
	DeleteTaskInput,
	UpdateTaskInput,
} from "@/schemas/tasks";
import { db } from "..";
import { columns, tasks, users } from "../schema/schemas";

export const getTasks = async ({
	pageSize = 20,
	cursor,
	...input
}: {
	pageSize?: number;
	cursor?: string;
	assigneeId?: string[];
	columnId?: string[];
	teamId?: string;
	search?: string;
}) => {
	console.log("Input:", input);
	const whereConditions: SQL[] = [];

	input.assigneeId &&
		input.assigneeId.length > 0 &&
		whereConditions.push(inArray(tasks.assigneeId, input.assigneeId));
	input.columnId &&
		whereConditions.push(inArray(tasks.columnId, input.columnId));
	input.teamId && whereConditions.push(eq(tasks.teamId, input.teamId));
	input.search && whereConditions.push(ilike(tasks.title, `%${input.search}%`));

	const query = db
		.select({
			id: tasks.id,
			title: tasks.title,
			description: tasks.description,
			assigneeId: tasks.assigneeId,
			assignee: {
				id: users.id,
				name: users.name,
				email: users.email,
				image: users.image,
				color: users.color,
			},
			columnId: tasks.columnId,
			order: tasks.order,
			priority: tasks.priority,
			dueDate: tasks.dueDate,
			createdAt: tasks.createdAt,
			updatedAt: tasks.updatedAt,
			teamId: tasks.teamId,
			attachments: tasks.attachments,
			column: {
				id: columns.id,
				name: columns.name,
				description: columns.description,
				order: columns.order,
				isFinalState: columns.isFinalState,
			},
		})
		.from(tasks)
		.where(and(...whereConditions))
		.innerJoin(columns, eq(tasks.columnId, columns.id))
		.leftJoin(users, eq(tasks.assigneeId, users.id))
		.orderBy(tasks.order);

	// Apply pagination
	const offset = cursor ? Number.parseInt(cursor, 10) : 0;
	query.limit(pageSize).offset(offset);

	// Execute query
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

export const createTask = async (input: CreateTaskInput) => {
	const [task] = await db
		.insert(tasks)
		.values({
			...input,
		})
		.returning();

	if (!task) {
		throw new Error("Failed to create task");
	}

	return task;
};

export const deleteTask = async (input: DeleteTaskInput) => {
	const whereClause: SQL[] = [eq(tasks.id, input.id)];

	if (input.teamId) {
		whereClause.push(eq(tasks.teamId, input.teamId));
	}

	const [task] = await db
		.delete(tasks)
		.where(and(...whereClause))
		.returning();

	if (!task) {
		throw new Error("Failed to delete task");
	}

	return task;
};

export const updateTask = async (input: UpdateTaskInput) => {
	const whereClause: SQL[] = [eq(tasks.id, input.id)];

	if (input.teamId) {
		whereClause.push(eq(tasks.teamId, input.teamId));
	}

	const [task] = await db
		.update(tasks)
		.set({
			...input,
			updatedAt: new Date().toISOString(),
		})
		.where(and(...whereClause))
		.returning();

	if (!task) {
		throw new Error("Failed to update task");
	}

	return task;
};

export const getTaskById = async (id: string, teamId?: string) => {
	const whereClause: SQL[] = [eq(tasks.id, id)];

	if (teamId) {
		whereClause.push(eq(tasks.teamId, teamId));
	}
	const [task] = await db
		.select()
		.from(tasks)
		.where(and(...whereClause))
		.limit(1);

	return task;
};
