import { and, desc, eq, type SQL } from "drizzle-orm";
import { db } from "..";
import {
	type ProjectHealthSnapshot,
	projectHealthUpdates,
	users,
} from "../schema";
import { getMilestones } from "./milestones";
import { getProjectProgress } from "./projects";

export const getProjectHealthUpdates = async ({
	teamId,
	projectId,
	pageSize = 20,
	cursor,
}: {
	teamId: string;
	projectId: string;
	pageSize?: number;
	cursor?: string;
}) => {
	const whereClause: SQL[] = [
		eq(projectHealthUpdates.teamId, teamId),
		eq(projectHealthUpdates.projectId, projectId),
	];

	const query = db
		.select({
			id: projectHealthUpdates.id,
			projectId: projectHealthUpdates.projectId,
			health: projectHealthUpdates.health,
			summary: projectHealthUpdates.summary,
			snapshot: projectHealthUpdates.snapshot,
			createdBy: {
				id: users.id,
				name: users.name,
				image: users.image,
			},
			createdAt: projectHealthUpdates.createdAt,
		})
		.from(projectHealthUpdates)
		.leftJoin(users, eq(projectHealthUpdates.createdBy, users.id))
		.where(and(...whereClause))
		.orderBy(desc(projectHealthUpdates.createdAt));

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

export const getLatestProjectHealthUpdate = async ({
	teamId,
	projectId,
}: {
	teamId: string;
	projectId: string;
}) => {
	const [update] = await db
		.select({
			id: projectHealthUpdates.id,
			projectId: projectHealthUpdates.projectId,
			health: projectHealthUpdates.health,
			summary: projectHealthUpdates.summary,
			snapshot: projectHealthUpdates.snapshot,
			createdBy: {
				id: users.id,
				name: users.name,
				image: users.image,
			},
			createdAt: projectHealthUpdates.createdAt,
		})
		.from(projectHealthUpdates)
		.leftJoin(users, eq(projectHealthUpdates.createdBy, users.id))
		.where(
			and(
				eq(projectHealthUpdates.teamId, teamId),
				eq(projectHealthUpdates.projectId, projectId),
			),
		)
		.orderBy(desc(projectHealthUpdates.createdAt))
		.limit(1);

	return update ?? null;
};

export const createProjectHealthUpdate = async ({
	teamId,
	projectId,
	health,
	summary,
	createdBy,
}: {
	teamId: string;
	projectId: string;
	health: "on_track" | "at_risk" | "off_track";
	summary?: string | null;
	createdBy: string;
}) => {
	const milestones = await getMilestones({
		teamId,
		projectId,
		pageSize: 20,
	});

	const projectProgress = await getProjectProgress({ projectId, teamId });

	const snapshot: ProjectHealthSnapshot = {
		progress: {
			milestones: milestones.data.map((m) => ({
				id: m.id,
				name: m.name,
				dueDate: m.dueDate,
				progress: {
					openTasks: m.progress.inProgress,
					completedTasks: m.progress.completed,
				},
			})),
			tasks: {
				total:
					projectProgress.overall.completed +
					projectProgress.overall.inProgress,
				completed: projectProgress.overall.completed,
				open: projectProgress.overall.inProgress,
			},
		},
	};

	const [update] = await db
		.insert(projectHealthUpdates)
		.values({
			teamId,
			projectId,
			health,
			snapshot,
			summary,
			createdBy,
		})
		.returning();

	return update;
};

export const getProjectHealthUpdateById = async ({
	id,
	teamId,
}: {
	id: string;
	teamId: string;
}) => {
	const [update] = await db
		.select({
			id: projectHealthUpdates.id,
			projectId: projectHealthUpdates.projectId,
			health: projectHealthUpdates.health,
			summary: projectHealthUpdates.summary,
			snapshot: projectHealthUpdates.snapshot,
			createdBy: {
				id: users.id,
				name: users.name,
				image: users.image,
			},
			createdAt: projectHealthUpdates.createdAt,
		})
		.from(projectHealthUpdates)
		.leftJoin(users, eq(projectHealthUpdates.createdBy, users.id))
		.where(
			and(
				eq(projectHealthUpdates.id, id),
				eq(projectHealthUpdates.teamId, teamId),
			),
		)
		.limit(1);

	return update ?? null;
};

export const updateProjectHealthUpdate = async ({
	id,
	teamId,
	health,
	summary,
}: {
	id: string;
	teamId: string;
	health?: "on_track" | "at_risk" | "off_track";
	summary?: string | null;
}) => {
	const [update] = await db
		.update(projectHealthUpdates)
		.set({
			...(health && { health }),
			...(summary !== undefined && { summary }),
		})
		.where(
			and(
				eq(projectHealthUpdates.id, id),
				eq(projectHealthUpdates.teamId, teamId),
			),
		)
		.returning();

	return update;
};

export const deleteProjectHealthUpdate = async ({
	id,
	teamId,
}: {
	id: string;
	teamId: string;
}) => {
	const result = await db
		.delete(projectHealthUpdates)
		.where(
			and(
				eq(projectHealthUpdates.id, id),
				eq(projectHealthUpdates.teamId, teamId),
			),
		);

	return result;
};
