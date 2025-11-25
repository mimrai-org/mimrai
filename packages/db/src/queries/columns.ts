import { columnsLimits } from "@mimir/utils/columns";
import { and, count, eq, inArray, type SQL } from "drizzle-orm";
import { db } from "..";
import { columns, type columnTypeEnum } from "../schema";

export const getColumns = async ({
	pageSize,
	cursor,
	teamId,
	type,
}: {
	pageSize: number;
	cursor?: string;
	teamId?: string;
	type?: Array<(typeof columnTypeEnum.enumValues)[number]>;
}) => {
	const whereConditions: SQL[] = [];

	if (teamId) whereConditions.push(eq(columns.teamId, teamId));
	if (type && type.length > 0)
		whereConditions.push(inArray(columns.type, type));

	const query = db
		.select({
			id: columns.id,
			name: columns.name,
			description: columns.description,
			order: columns.order,
			type: columns.type,
		})
		.from(columns)
		.where(and(...whereConditions))
		.orderBy(columns.order);

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

export const createColumn = async (input: {
	name: string;
	description?: string;
	order?: number;
	type: (typeof columnTypeEnum.enumValues)[number];
	teamId: string;
}) => {
	// Check column limits
	const [columnsCount] = await db
		.select({
			count: count(columns.id),
		})
		.from(columns)
		.where(and(eq(columns.teamId, input.teamId), eq(columns.type, input.type)));

	const currentCount = Number(columnsCount?.count ?? 0) + 1;
	const limit = columnsLimits[input.type as keyof typeof columnsLimits];

	if (limit && currentCount > limit) {
		throw new Error(
			`Cannot create more than ${limit} columns of type ${input.type}`,
		);
	}

	const [column] = await db
		.insert(columns)
		.values({
			...input,
		})
		.returning();

	if (!column) {
		throw new Error("Failed to create column");
	}

	return column;
};

export const deleteColumn = async (input: { id: string; teamId: string }) => {
	const [column] = await db
		.delete(columns)
		.where(and(eq(columns.id, input.id), eq(columns.teamId, input.teamId)))
		.returning();

	if (!column) {
		throw new Error("Failed to delete column");
	}

	return column;
};

export const updateColumn = async (input: {
	id: string;
	name?: string;
	description?: string;
	order?: number;
	type?: (typeof columnTypeEnum.enumValues)[number];
	teamId: string;
}) => {
	const [column] = await db
		.update(columns)
		.set({
			...input,
		})
		.where(and(eq(columns.id, input.id), eq(columns.teamId, input.teamId)))
		.returning();

	if (!column) {
		throw new Error("Failed to update column");
	}

	return column;
};

export const getColumnById = async ({
	id,
	teamId,
}: {
	id: string;
	teamId?: string;
}) => {
	const whereClause: SQL[] = [eq(columns.id, id)];
	if (teamId) whereClause.push(eq(columns.teamId, teamId));

	const [column] = await db
		.select({
			id: columns.id,
			name: columns.name,
			description: columns.description,
			order: columns.order,
			type: columns.type,
		})
		.from(columns)
		.where(and(...whereClause))
		.limit(1);

	if (!column) {
		throw new Error("Column not found");
	}

	return column;
};

export const createDefaultColumns = async (teamId: string) => {
	const defaultColumns = [
		{
			name: "Backlog",
			description: "Tasks to be prioritized",
			order: 0,
			type: "backlog" as const,
		},
		{
			name: "To Do",
			description: "Tasks to be done",
			order: 1,
			type: "to_do" as const,
		},
		{
			name: "In Progress",
			description: "Tasks in progress",
			order: 2,
			type: "in_progress" as const,
		},
		{
			name: "Done",
			description: "Completed tasks",
			order: 3,
			type: "done" as const,
		},
	];

	const data = await db
		.insert(columns)
		.values(
			defaultColumns.map((column) => ({
				...column,
				teamId,
			})),
		)
		.returning();

	return data;
};

export const getBacklogColumn = async ({ teamId }: { teamId: string }) => {
	const [existing] = await db
		.select()
		.from(columns)
		.where(and(eq(columns.teamId, teamId), eq(columns.type, "backlog")))
		.limit(1);

	if (existing) {
		return existing;
	}

	const [column] = await db
		.insert(columns)
		.values({
			name: "Backlog",
			description: "Not yet prioritized tasks",
			order: 0,
			type: "backlog",
			teamId,
		})
		.returning();

	if (!column) {
		throw new Error("Failed to create backlog column");
	}

	return column;
};
