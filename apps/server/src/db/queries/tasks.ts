import { and, eq, inArray, type SQL } from "drizzle-orm";
import type {
	CreateTaskInput,
	DeleteTaskInput,
	GetTasksInput,
	UpdateTaskInput,
} from "@/schemas/tasks";
import { db } from "..";
import { columns, tasks } from "../schema/schemas";

export const getTasks = async ({
	pageSize,
	cursor,
	...input
}: GetTasksInput) => {
	const whereConditions: SQL[] = [];

	input.assigneeId &&
		whereConditions.push(inArray(tasks.assigneeId, input.assigneeId));
	input.columnId &&
		whereConditions.push(inArray(tasks.columnId, input.columnId));

	const query = db
		.select({
			id: tasks.id,
			title: tasks.title,
			description: tasks.description,
			assigneeId: tasks.assigneeId,
			columnId: tasks.columnId,
			order: tasks.order,
			priority: tasks.priority,
			dueDate: tasks.dueDate,
			column: {
				id: columns.id,
				name: columns.name,
				description: columns.description,
				order: columns.order,
			},
		})
		.from(tasks)
		.where(and(...whereConditions))
		.leftJoin(columns, eq(tasks.columnId, columns.id));

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
	const [task] = await db
		.delete(tasks)
		.where(eq(tasks.id, input.id))
		.returning();

	if (!task) {
		throw new Error("Failed to delete task");
	}

	return task;
};

export const updateTask = async (input: UpdateTaskInput) => {
	const [task] = await db
		.update(tasks)
		.set({
			...input,
			updatedAt: new Date().toISOString(),
		})
		.where(eq(tasks.id, input.id))
		.returning();

	if (!task) {
		throw new Error("Failed to update task");
	}

	return task;
};
