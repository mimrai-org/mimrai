import { extractMagicTaskActions } from "@mimir/utils/pr-reviews";
import {
	and,
	arrayContains,
	count,
	desc,
	eq,
	type InferInsertModel,
	inArray,
	or,
} from "drizzle-orm";
import { db } from "../index";
import { type prReviewStatusEnum, prReviews } from "../schema";
import { getLinkedUsers } from "./integrations";
import { executeMagicTaskActions } from "./tasks";

type SyncPrPreviewInput = {
	teamId: string;
	externalId: number;
	title: string;
	html_url: string;
	body?: string;
	connectedRepoId: string;
	number: number;
	state: string;
	assignees?: {
		login: string;
		avatar_url: string;
	}[];
	requested_reviewers?: {
		login: string;
		avatar_url: string;
	}[];
	draft?: boolean;
	merged?: boolean;
};

const getPrPreviewStatus = (
	input: Omit<InferInsertModel<typeof prReviews>, "status">,
): (typeof prReviewStatusEnum.enumValues)[number] => {
	if (input.merged) return "approved";
	if (input.state === "closed") return "closed";
	if (input.draft) return "pending";
	if (input.reviewersUserIds && input.reviewersUserIds.length > 0)
		return "review_requested";

	return "pending";
};

export const syncPrReview = async ({
	assignees,
	requested_reviewers,
	html_url,
	number,
	body,
	...input
}: SyncPrPreviewInput) => {
	if (input.state === "closed" && !input.merged) {
		// Delete closed and unmerged PR reviews
		await db
			.delete(prReviews)
			.where(
				and(
					eq(prReviews.teamId, input.teamId),
					eq(prReviews.externalId, input.externalId),
				),
			);
		return null;
	}

	const linkedUsers = await getLinkedUsers({
		teamId: input.teamId,
		integrationType: "github",
	});

	const assigneesWithUserIds =
		assignees?.map((assignee) => ({
			name: assignee.login,
			avatarUrl: assignee.avatar_url,
			userId:
				linkedUsers.data.find(
					(link) => link.externalUserName === assignee.login,
				)?.userId || undefined,
		})) ?? [];

	const reviewersWithUserIds =
		requested_reviewers?.map((reviewer) => ({
			name: reviewer.login,
			avatarUrl: reviewer.avatar_url,
			userId:
				linkedUsers.data.find(
					(link) => link.externalUserName === reviewer.login,
				)?.userId || undefined,
		})) ?? [];

	const insertData: InferInsertModel<typeof prReviews> = {
		...input,
		prUrl: html_url,
		prNumber: number,
		assigneesUserIds: assigneesWithUserIds
			.map((a) => a.userId)
			.filter((id): id is string => id !== null),
		reviewersUserIds: reviewersWithUserIds
			.map((r) => r.userId)
			.filter((id): id is string => id !== null),
		assignees: assigneesWithUserIds,
		reviewers: reviewersWithUserIds,
		body: body || "",
		updatedAt: new Date().toISOString(),
		createdAt: new Date().toISOString(),
	};

	insertData.status = getPrPreviewStatus(insertData);

	const [prReview] = await db
		.insert(prReviews)
		.values(insertData)
		.onConflictDoUpdate({
			target: prReviews.externalId,
			set: insertData,
		})
		.returning();

	if (!prReview) {
		throw new Error("Failed to sync PR review");
	}

	// get magic actions
	const magicActions = extractMagicTaskActions(prReview);
	let executedMagicActions: ((typeof magicActions)[number] & {
		taskUrl: string;
	})[] = [];
	if (magicActions.length > 0) {
		executedMagicActions = await executeMagicTaskActions({
			teamId: input.teamId,
			actions: magicActions,
			prReviewId: prReview.id,
		});
	}

	return {
		prReview,
		magicActions: executedMagicActions,
	};
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

export const getPrReviewsCount = async ({
	teamId,
	state,
	userId,
}: {
	teamId: string;
	state?: ("open" | "closed")[];
	userId?: string;
}) => {
	const whereClasuses = [eq(prReviews.teamId, teamId)];

	if (state) whereClasuses.push(inArray(prReviews.state, state));
	if (userId)
		whereClasuses.push(
			or(
				arrayContains(prReviews.assigneesUserIds, [userId]),
				arrayContains(prReviews.reviewersUserIds, [userId]),
			)!,
		);
	const [c] = await db
		.select({
			count: count(prReviews.id),
		})
		.from(prReviews)
		.where(and(...whereClasuses))
		.limit(1);

	return Number(c?.count ?? 0);
};
