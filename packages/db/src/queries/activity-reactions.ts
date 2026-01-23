import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "..";
import { activities, activityReactions, users } from "../schema";

export interface CreateActivityReactionInput {
	activityId: string;
	userId: string;
	reaction: string;
}

export const createActivityReaction = async (
	input: CreateActivityReactionInput,
) => {
	const [reaction] = await db
		.insert(activityReactions)
		.values(input)
		.returning();

	return reaction;
};

export const deleteActivityReaction = async ({
	activityId,
	userId,
	reaction,
}: CreateActivityReactionInput) => {
	const [deletedReaction] = await db
		.delete(activityReactions)
		.where(
			and(
				eq(activityReactions.activityId, activityId),
				eq(activityReactions.userId, userId),
				eq(activityReactions.reaction, reaction),
			),
		)
		.returning();

	return deletedReaction;
};

export const getActivityReactions = async (activityId: string) => {
	const reactions = await db
		.select({
			id: activityReactions.id,
			reaction: activityReactions.reaction,
			createdAt: activityReactions.createdAt,
			user: {
				id: users.id,
				name: users.name,
				email: users.email,
				image: users.image,
				color: users.color,
			},
		})
		.from(activityReactions)
		.innerJoin(users, eq(activityReactions.userId, users.id))
		.where(eq(activityReactions.activityId, activityId))
		.orderBy(activityReactions.createdAt);

	return reactions;
};

export const getActivityReactionsSummary = async (activityId: string) => {
	const summary = await db
		.select({
			reaction: activityReactions.reaction,
			count: sql<number>`COUNT(*)`.as("count"),
			users: sql<
				Array<{
					id: string;
					name: string;
					image: string | null;
				}>
			>`ARRAY_AGG(JSON_BUILD_OBJECT('id', ${users.id}, 'name', ${users.name}, 'image', ${users.image}))`.as(
				"users",
			),
		})
		.from(activityReactions)
		.innerJoin(users, eq(activityReactions.userId, users.id))
		.where(eq(activityReactions.activityId, activityId))
		.groupBy(activityReactions.reaction)
		.orderBy(sql`COUNT(*) DESC`);

	return summary;
};

export type ReactionSummary = {
	reaction: string;
	count: number;
	users: Array<{ id: string; name: string; image: string | null }>;
};

export const getActivitiesReactionsSummary = async (activityIds: string[]) => {
	if (activityIds.length === 0) return new Map<string, ReactionSummary[]>();

	const summary = await db
		.select({
			activityId: activityReactions.activityId,
			reaction: activityReactions.reaction,
			count: sql<number>`COUNT(*)`.as("count"),
			users: sql<
				Array<{
					id: string;
					name: string;
					image: string | null;
				}>
			>`ARRAY_AGG(JSON_BUILD_OBJECT('id', ${users.id}, 'name', ${users.name}, 'image', ${users.image}))`.as(
				"users",
			),
		})
		.from(activityReactions)
		.innerJoin(users, eq(activityReactions.userId, users.id))
		.where(inArray(activityReactions.activityId, activityIds))
		.groupBy(activityReactions.activityId, activityReactions.reaction)
		.orderBy(sql`COUNT(*) DESC`);

	// Group by activityId
	const grouped = new Map<string, ReactionSummary[]>();
	for (const row of summary) {
		const existing = grouped.get(row.activityId) || [];
		existing.push({
			reaction: row.reaction,
			count: row.count,
			users: row.users,
		});
		grouped.set(row.activityId, existing);
	}

	return grouped;
};

export const toggleActivityReaction = async (
	input: CreateActivityReactionInput,
) => {
	// Check if reaction already exists
	const existing = await db
		.select()
		.from(activityReactions)
		.where(
			and(
				eq(activityReactions.activityId, input.activityId),
				eq(activityReactions.userId, input.userId),
				eq(activityReactions.reaction, input.reaction),
			),
		)
		.limit(1);

	if (existing.length > 0) {
		// Remove reaction
		return deleteActivityReaction(input);
	}
	// Add reaction
	return createActivityReaction(input);
};
