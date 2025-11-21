import { and, desc, eq } from "drizzle-orm";
import { db } from "..";
import { intake, type intakeStatusEnum } from "../schema";

/**
 * Get intakes for a team with cursor-based pagination and filtering
 */
export const getIntakes = async ({
	teamId,
	status,
	pageSize = 50,
	cursor,
}: {
	teamId: string;
	status?: (typeof intakeStatusEnum.enumValues)[number];
	pageSize?: number;
	cursor?: string;
}) => {
	const filters = [eq(intake.teamId, teamId)];

	if (status) {
		filters.push(eq(intake.status, status));
	}

	// Apply pagination
	const offset = cursor ? Number.parseInt(cursor, 10) : 0;

	const data = await db
		.select()
		.from(intake)
		.where(and(...filters))
		.orderBy(desc(intake.createdAt))
		.limit(pageSize)
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

/**
 * Create a new intake item
 */
export const createIntakeItem = async ({
	teamId,
	userId,
	source,
	content,
	status,
	aiAnalysis,
	metadata,
	sourceMessageId,
}: {
	teamId: string;
	userId?: string | null;
	source: "gmail" | "voice" | "manual";
	content: string;
	status?: "pending" | "accepted" | "rejected";
	aiAnalysis?: {
		suggestedTitle?: string;
		suggestedDescription?: string;
		suggestedSubtasks?: string[];
		suggestedDueDate?: string;
		suggestedPriority?: "low" | "medium" | "high" | "urgent";
		suggestedAssignee?: string;
		confidence?: number;
		summary?: string;
		actionItems?: string[];
		category?: string;
	};
	metadata?: {
		emailId?: string;
		sender?: string;
		subject?: string;
		date?: string;
		snippet?: string;
		originalHtml?: string;
	};
	sourceMessageId?: string | null;
}) => {
	const [created] = await db
		.insert(intake)
		.values({
			teamId,
			userId,
			source,
			content,
			status,
			aiAnalysis,
			metadata,
			sourceMessageId,
		})
		.returning();
	return created;
};

/**
 * Get a specific intake item by ID ensuring team ownership
 */
export const getIntakeItemById = async ({
	id,
	teamId,
}: {
	id: string;
	teamId: string;
}) => {
	const [item] = await db
		.select()
		.from(intake)
		.where(and(eq(intake.id, id), eq(intake.teamId, teamId)))
		.limit(1);

	return item;
};

/**
 * Update intake item status (accept/reject)
 */
export const updateIntakeItemStatus = async ({
	id,
	teamId,
	status,
}: {
	id: string;
	teamId: string;
	status: (typeof intakeStatusEnum.enumValues)[number];
}) => {
	const [updated] = await db
		.update(intake)
		.set({
			status,
			updatedAt: new Date().toISOString(),
		})
		.where(and(eq(intake.id, id), eq(intake.teamId, teamId)))
		.returning();

	return updated;
};

/**
 * Update AI analysis for an intake item
 */
export const updateIntakeItemAnalysis = async ({
	id,
	teamId,
	aiAnalysis,
}: {
	id: string;
	teamId: string;
	aiAnalysis: typeof intake.$inferSelect.aiAnalysis;
}) => {
	const [updated] = await db
		.update(intake)
		.set({
			aiAnalysis,
			updatedAt: new Date().toISOString(),
		})
		.where(and(eq(intake.id, id), eq(intake.teamId, teamId)))
		.returning();

	return updated;
};

/**
 * Delete an intake item
 */
export const deleteIntakeItem = async ({
	id,
	teamId,
}: {
	id: string;
	teamId: string;
}) => {
	const [deleted] = await db
		.delete(intake)
		.where(and(eq(intake.id, id), eq(intake.teamId, teamId)))
		.returning();

	return deleted;
};
