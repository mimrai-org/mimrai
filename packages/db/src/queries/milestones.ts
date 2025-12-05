import { and, desc, eq, type SQL, sql } from "drizzle-orm";
import { db } from "..";
import { columns, milestones, tasks } from "../schema";

export const getMilestones = async ({
	teamId,
	projectId,
	pageSize = 20,
	cursor,
}: {
	teamId?: string;
	projectId?: string;
	pageSize?: number;
	cursor?: string;
}) => {
	const whereClause: SQL[] = [];
	if (teamId) whereClause.push(eq(milestones.teamId, teamId));
	if (projectId) whereClause.push(eq(milestones.projectId, projectId));

	const progressSubquery = db
		.select({
			milestoneId: tasks.milestoneId,
			completed:
				sql<number>`COUNT(${tasks.id}) FILTER (WHERE ${columns.type} = 'done')`.as(
					"completed",
				),
			inProgress:
				sql<number>`COUNT(${tasks.id}) FILTER (WHERE ${columns.type} IN ('in_progress', 'review', 'to_do', 'backlog'))`.as(
					"in_progress",
				),
		})
		.from(tasks)
		.innerJoin(columns, eq(tasks.columnId, columns.id))
		.groupBy(tasks.milestoneId)
		.as("progress_sq");

	const query = db
		.select({
			id: milestones.id,
			name: milestones.name,
			description: milestones.description,
			dueDate: milestones.dueDate,
			color: milestones.color,
			projectId: milestones.projectId,
			progress: {
				completed: progressSubquery.completed,
				inProgress: progressSubquery.inProgress,
			},
			createdAt: milestones.createdAt,
			updatedAt: milestones.updatedAt,
		})
		.from(milestones)
		.leftJoin(progressSubquery, eq(milestones.id, progressSubquery.milestoneId))
		.where(and(...whereClause))
		.orderBy(desc(milestones.createdAt));

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
		data: data.map((milestone) => ({
			...milestone,
			progress: {
				completed: milestone.progress.completed
					? Number(milestone.progress.completed)
					: 0,
				inProgress: milestone.progress.inProgress
					? Number(milestone.progress.inProgress)
					: 0,
			},
		})),
	};
};

export const createMilestone = async ({
	teamId,
	projectId,
	...input
}: {
	name: string;
	description?: string;
	dueDate?: string;
	color?: string;
	teamId: string;
	projectId: string;
}) => {
	const [milestone] = await db
		.insert(milestones)
		.values({
			...input,
			teamId,
			projectId,
		})
		.returning();

	return milestone;
};

export const getMilestoneById = async ({
	milestoneId,
	teamId,
}: {
	milestoneId: string;
	teamId?: string;
}) => {
	const whereClause: SQL[] = [eq(milestones.id, milestoneId)];
	if (teamId) whereClause.push(eq(milestones.teamId, teamId));
	const [milestone] = await db
		.select({
			id: milestones.id,
			name: milestones.name,
			description: milestones.description,
			dueDate: milestones.dueDate,
			color: milestones.color,
			projectId: milestones.projectId,
			createdAt: milestones.createdAt,
			updatedAt: milestones.updatedAt,
		})
		.from(milestones)
		.where(and(...whereClause))
		.limit(1);
	return milestone;
};

export const deleteMilestone = async ({
	milestoneId,
	teamId,
}: {
	milestoneId: string;
	teamId?: string;
}) => {
	const whereClause: SQL[] = [eq(milestones.id, milestoneId)];
	if (teamId) whereClause.push(eq(milestones.teamId, teamId));
	const result = await db.delete(milestones).where(and(...whereClause));
	return result;
};

export const updateMilestone = async ({
	id,
	teamId,
	...input
}: {
	id: string;
	name?: string;
	description?: string;
	dueDate?: string;
	color?: string;
	teamId?: string;
}) => {
	const whereClause: SQL[] = [eq(milestones.id, id)];
	if (teamId) whereClause.push(eq(milestones.teamId, teamId));

	const [result] = await db
		.update(milestones)
		.set({
			...input,
			updatedAt: new Date().toISOString(),
		})
		.where(and(...whereClause))
		.returning();
	return result;
};
