import { and, eq, type SQL } from "drizzle-orm";
import type {
	CreateColumnInput,
	DeleteColumnInput,
	GetColumnsInput,
	UpdateColumnInput,
} from "@/schemas/columns";
import { db } from "..";
import { columns } from "../schema/schemas";

export const getColumns = async ({ pageSize, cursor }: GetColumnsInput) => {
	const whereConditions: SQL[] = [];

	const query = db
		.select({
			id: columns.id,
			name: columns.name,
			description: columns.description,
			order: columns.order,
		})
		.from(columns)
		.where(and(...whereConditions));

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

export const createColumn = async (input: CreateColumnInput) => {
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

export const deleteColumn = async (input: DeleteColumnInput) => {
	const [column] = await db
		.delete(columns)
		.where(eq(columns.id, input.id))
		.returning();

	if (!column) {
		throw new Error("Failed to delete column");
	}

	return column;
};

export const updateColumn = async (input: UpdateColumnInput) => {
	const [column] = await db
		.update(columns)
		.set({
			...input,
		})
		.where(eq(columns.id, input.id))
		.returning();

	if (!column) {
		throw new Error("Failed to update column");
	}

	return column;
};
