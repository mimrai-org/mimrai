import { and, desc, eq } from "drizzle-orm";
import { db } from "..";
import { intake, type intakeStatusEnum } from "../schema";

/**
 * Get intake items for a team with pagination and filtering
 */
export const getIntakeItems = async ({
	teamId,
	status,
	limit = 50,
	offset = 0,
}: {
	teamId: string;
	status?: (typeof intakeStatusEnum.enumValues)[number];
	limit?: number;
	offset?: number;
}) => {
	const filters = [eq(intake.teamId, teamId)];

	if (status) {
		filters.push(eq(intake.status, status));
	}

	return await db
		.select()
		.from(intake)
		.where(and(...filters))
		.orderBy(desc(intake.createdAt))
		.limit(limit)
		.offset(offset);
};

/**
 * Create a new intake item
 */
export const createIntakeItem = async (item: typeof intake.$inferInsert) => {
	const [created] = await db.insert(intake).values(item).returning();
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
