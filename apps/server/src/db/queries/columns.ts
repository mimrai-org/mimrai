import { and, eq, type SQL } from "drizzle-orm";
import type { DeleteColumnInput, UpdateColumnInput } from "@/schemas/columns";
import { db } from "..";
import { columns } from "../schema/schemas";

export const getColumns = async ({
	pageSize,
	cursor,
	teamId,
}: {
	pageSize: number;
	cursor?: string;
	teamId?: string;
}) => {
	const whereConditions: SQL[] = [];

	if (teamId) whereConditions.push(eq(columns.teamId, teamId));

	const query = db
		.select({
			id: columns.id,
			name: columns.name,
			description: columns.description,
			order: columns.order,
			isFinalState: columns.isFinalState,
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
	isFinalState?: boolean;
	teamId: string;
}) => {
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
	isFinalState?: boolean;
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
			isFinalState: columns.isFinalState,
		})
		.from(columns)
		.where(and(...whereClause))
		.limit(1);

	if (!column) {
		throw new Error("Column not found");
	}

	return column;
};
