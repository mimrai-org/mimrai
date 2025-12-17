import { statusesLimits } from "@mimir/utils/statuses";
import { and, count, eq, inArray, type SQL } from "drizzle-orm";
import { db } from "..";
import { statuses, type statusTypeEnum } from "../schema";

export const getStatuses = async ({
	pageSize,
	cursor,
	teamId,
	type,
}: {
	pageSize: number;
	cursor?: string;
	teamId?: string;
	type?: Array<(typeof statusTypeEnum.enumValues)[number]>;
}) => {
	const whereConditions: SQL[] = [];

	if (teamId) whereConditions.push(eq(statuses.teamId, teamId));
	if (type && type.length > 0)
		whereConditions.push(inArray(statuses.type, type));

	const query = db
		.select({
			id: statuses.id,
			name: statuses.name,
			description: statuses.description,
			order: statuses.order,
			type: statuses.type,
		})
		.from(statuses)
		.where(and(...whereConditions))
		.orderBy(statuses.order);

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

export const createStatus = async (input: {
	name: string;
	description?: string;
	order?: number;
	type: (typeof statusTypeEnum.enumValues)[number];
	teamId: string;
}) => {
	// Check status limits
	const [statusesCount] = await db
		.select({
			count: count(statuses.id),
		})
		.from(statuses)
		.where(
			and(eq(statuses.teamId, input.teamId), eq(statuses.type, input.type)),
		);

	const currentCount = Number(statusesCount?.count ?? 0) + 1;
	const limit = statusesLimits[input.type as keyof typeof statusesLimits];

	if (limit && currentCount > limit) {
		throw new Error(
			`Cannot create more than ${limit} statuses of type ${input.type}`,
		);
	}

	const [status] = await db
		.insert(statuses)
		.values({
			...input,
		})
		.returning();

	if (!status) {
		throw new Error("Failed to create status");
	}

	return status;
};

export const deleteStatus = async (input: { id: string; teamId: string }) => {
	const [status] = await db
		.delete(statuses)
		.where(and(eq(statuses.id, input.id), eq(statuses.teamId, input.teamId)))
		.returning();

	if (!status) {
		throw new Error("Failed to delete status");
	}

	return status;
};

export const updateStatus = async (input: {
	id: string;
	name?: string;
	description?: string;
	order?: number;
	type?: (typeof statusTypeEnum.enumValues)[number];
	teamId: string;
}) => {
	const [status] = await db
		.update(statuses)
		.set({
			...input,
		})
		.where(and(eq(statuses.id, input.id), eq(statuses.teamId, input.teamId)))
		.returning();

	if (!status) {
		throw new Error("Failed to update status");
	}

	return status;
};

export const getStatusById = async ({
	id,
	teamId,
}: {
	id: string;
	teamId?: string;
}) => {
	const whereClause: SQL[] = [eq(statuses.id, id)];
	if (teamId) whereClause.push(eq(statuses.teamId, teamId));

	const [status] = await db
		.select({
			id: statuses.id,
			name: statuses.name,
			description: statuses.description,
			order: statuses.order,
			type: statuses.type,
		})
		.from(statuses)
		.where(and(...whereClause))
		.limit(1);

	if (!status) {
		throw new Error("Status not found");
	}

	return status;
};

export const createDefaultStatuses = async (teamId: string) => {
	const defaultStatuses = [
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
		.insert(statuses)
		.values(
			defaultStatuses.map((status) => ({
				...status,
				teamId,
			})),
		)
		.returning();

	return data;
};

export const reorderStatuses = async ({
	items,
	teamId,
}: {
	items: Array<{ id: string; order: number }>;
	teamId: string;
}) => {
	const results = await Promise.all(
		items.map((item) =>
			db
				.update(statuses)
				.set({ order: item.order })
				.where(and(eq(statuses.id, item.id), eq(statuses.teamId, teamId)))
				.returning(),
		),
	);

	return results.flat();
};

export const getBacklogStatus = async ({ teamId }: { teamId: string }) => {
	const [existing] = await db
		.select()
		.from(statuses)
		.where(and(eq(statuses.teamId, teamId), eq(statuses.type, "backlog")))
		.limit(1);

	if (existing) {
		return existing;
	}

	const [status] = await db
		.insert(statuses)
		.values({
			name: "Backlog",
			description: "Not yet prioritized tasks",
			order: 0,
			type: "backlog",
			teamId,
		})
		.returning();

	if (!status) {
		throw new Error("Failed to create backlog status");
	}

	return status;
};
