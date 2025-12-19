import {
	and,
	arrayContains,
	desc,
	eq,
	type InferInsertModel,
	inArray,
	or,
} from "drizzle-orm";
import { db } from "../index";
import { prReviews } from "../schema";

export const syncPrReview = async ({
	...input
}: InferInsertModel<typeof prReviews>) => {
	return db
		.insert(prReviews)
		.values({
			...input,
		})
		.onConflictDoUpdate({
			target: prReviews.externalId,
			set: {
				...input,
				updatedAt: new Date().toISOString(),
			},
		})
		.returning();
};

export const getPrReviews = async ({
	teamId,
	pageSize = 20,
	includeIds,
	cursor,
	state,
	reviewerId,
	assigneeId,
}: {
	teamId: string;
	includeIds?: string[];
	pageSize?: number;
	cursor?: string;
	state?: ("open" | "closed")[];
	reviewerId?: string;
	assigneeId?: string;
}) => {
	const whereClasuses = [eq(prReviews.teamId, teamId)];

	if (state) whereClasuses.push(inArray(prReviews.state, state));
	if (assigneeId)
		whereClasuses.push(arrayContains(prReviews.assigneesUserIds, [assigneeId]));
	if (reviewerId)
		whereClasuses.push(arrayContains(prReviews.reviewersUserIds, [reviewerId]));

	const query = db
		.select()
		.from(prReviews)
		.where(
			or(
				and(...whereClasuses),
				and(
					eq(prReviews.teamId, teamId),
					includeIds ? inArray(prReviews.id, includeIds) : eq(prReviews.id, ""),
				),
			),
		)
		.orderBy(desc(prReviews.createdAt));

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
