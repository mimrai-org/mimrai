import { and, desc, eq, inArray, type SQL } from "drizzle-orm";
import { db } from "..";
import { activities, type activityTypeEnum, users } from "../schema";

export const createActivity = async (input: {
	userId?: string | null;
	teamId: string;
	groupId?: string;
	type: (typeof activityTypeEnum.enumValues)[number];
	metadata?: Record<string, any>;
}) => {
	if (input.groupId && input.userId) {
		// Check if the last activity is the same type and from the same user
		const [lastActivity] = await db
			.select()
			.from(activities)
			.where(
				and(
					eq(activities.groupId, input.groupId),
					eq(activities.userId, input.userId),
					eq(activities.type, input.type),
				),
			)
			.orderBy(desc(activities.createdAt))
			.limit(1);

		// Delete the last activity if it's the same type and from the same user
		if (
			lastActivity &&
			JSON.stringify(lastActivity.metadata ?? {}) ===
				JSON.stringify(input.metadata ?? {})
		) {
			await db.delete(activities).where(eq(activities.id, lastActivity.id));
		}
	}

	const [result] = await db
		.insert(activities)
		.values({
			userId: input.userId,
			teamId: input.teamId,
			type: input.type,
			groupId: input.groupId,
			metadata: input.metadata,
		})
		.returning();

	return result;
};

export const getActivities = async ({
	teamId,
	type,
	cursor,
	groupId,
	pageSize,
}: {
	teamId?: string;
	type?: (typeof activityTypeEnum.enumValues)[number][];
	groupId?: string;
	cursor?: string;
	pageSize?: number;
}) => {
	const whereClause: SQL[] = [];

	teamId && whereClause.push(eq(activities.teamId, teamId));
	type && whereClause.push(inArray(activities.type, type));
	groupId && whereClause.push(eq(activities.groupId, groupId));

	// Convert cursor to offset
	const offset = cursor ? Number.parseInt(cursor, 10) : 0;

	const data = await db
		.select({
			id: activities.id,
			type: activities.type,
			createdAt: activities.createdAt,
			metadata: activities.metadata,
			userId: activities.userId,
			user: {
				id: users.id,
				name: users.name,
				email: users.email,
				color: users.color,
			},
			groupId: activities.groupId,
			teamId: activities.teamId,
		})
		.from(activities)
		.where(and(...whereClause))
		.leftJoin(users, eq(activities.userId, users.id))
		.orderBy(desc(activities.createdAt))
		.limit(pageSize ?? 20)
		.offset(offset);

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
