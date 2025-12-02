import { and, eq, inArray, notInArray, type SQL, sql } from "drizzle-orm";
import { db } from "..";
import { columns, projects, tasks, users } from "../schema";

export const getProjects = async ({
	teamId,
	pageSize = 20,
	cursor,
}: {
	teamId?: string;
	pageSize?: number;
	cursor?: string;
}) => {
	const whereClause: SQL[] = [];
	if (teamId) whereClause.push(eq(projects.teamId, teamId));

	const progressSubquery = db
		.select({
			projectId: tasks.projectId,
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
		.groupBy(tasks.projectId)
		.as("progress_sq");

	const query = db
		.select({
			id: projects.id,
			name: projects.name,
			description: projects.description,
			color: projects.color,
			archived: projects.archived,
			progress: {
				completed: progressSubquery.completed,
				inProgress: progressSubquery.inProgress,
			},
			createdAt: projects.createdAt,
			updatedAt: projects.updatedAt,
		})
		.from(projects)
		.leftJoin(progressSubquery, eq(projects.id, progressSubquery.projectId))
		.where(and(...whereClause));

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
		data: data.map((project) => ({
			...project,
			progress: {
				completed: project.progress.completed
					? Number(project.progress.completed)
					: 0,
				inProgress: project.progress.inProgress
					? Number(project.progress.inProgress)
					: 0,
			},
		})),
	};
};

export const createProject = async ({
	userId,
	teamId,
	...input
}: {
	name: string;
	description?: string;
	color?: string;
	userId: string;
	teamId: string;
}) => {
	const project = await db.insert(projects).values({
		...input,
		userId,
		teamId,
	});

	return project;
};

export const getProjectById = async ({
	projectId,
	teamId,
}: {
	projectId: string;
	teamId?: string;
}) => {
	const whereClause: SQL[] = [eq(projects.id, projectId)];
	if (teamId) whereClause.push(eq(projects.teamId, teamId));
	const [project] = await db
		.select({
			id: projects.id,
			name: projects.name,
			description: projects.description,
			color: projects.color,
			archived: projects.archived,
			createdAt: projects.createdAt,
			updatedAt: projects.updatedAt,
		})
		.from(projects)
		.where(and(...whereClause))
		.limit(1);
	return project;
};

export const deleteProject = async ({
	projectId,
	teamId,
}: {
	projectId: string;
	teamId?: string;
}) => {
	const whereClause: SQL[] = [eq(projects.id, projectId)];
	if (teamId) whereClause.push(eq(projects.teamId, teamId));
	const result = await db.delete(projects).where(and(...whereClause));
	return result;
};

export const updateProject = async ({
	id,
	teamId,
	...input
}: {
	id: string;
	name?: string;
	color?: string;
	archived?: boolean;
	description?: string;
	teamId?: string;
}) => {
	const whereClause: SQL[] = [eq(projects.id, id)];
	if (teamId) whereClause.push(eq(projects.teamId, teamId));

	const result = await db
		.update(projects)
		.set({
			...input,
			updatedAt: new Date().toISOString(),
		})
		.where(and(...whereClause));
	return result;
};

export const getProjectProgress = async ({
	projectId,
	teamId,
}: {
	projectId: string;
	teamId?: string;
}) => {
	const whereClause: SQL[] = [eq(projects.id, projectId)];
	if (teamId) whereClause.push(eq(projects.teamId, teamId));

	const [overall] = await db
		.select({
			completed:
				sql<number>`COUNT(${tasks.id}) FILTER (WHERE ${columns.type} = 'done')`.as(
					"completed",
				),
			inProgress:
				sql<number>`COUNT(${tasks.id}) FILTER (WHERE ${columns.type} NOT IN ('done'))`.as(
					"in_progress",
				),
		})
		.from(projects)
		.leftJoin(tasks, eq(projects.id, tasks.projectId))
		.leftJoin(columns, eq(tasks.columnId, columns.id))
		.where(and(...whereClause))
		.groupBy(projects.id)
		.limit(1);

	const members = await db
		.select({
			id: users.id,
			name: users.name,
			email: users.email,
			color: users.color,
			image: users.image,
			completed:
				sql<number>`COUNT(${tasks.id}) FILTER (WHERE ${columns.type} = 'done')`.as(
					"completed",
				),
			inProgress:
				sql<number>`COUNT(${tasks.id}) FILTER (WHERE ${columns.type} NOT IN ('done'))`.as(
					"in_progress",
				),
		})
		.from(projects)
		.innerJoin(tasks, eq(projects.id, tasks.projectId))
		.innerJoin(columns, eq(tasks.columnId, columns.id))
		.innerJoin(users, eq(tasks.assigneeId, users.id))
		.where(and(...whereClause))
		.groupBy(users.id);

	return {
		overall: {
			completed: overall?.completed ? Number(overall.completed) : 0,
			inProgress: overall?.inProgress ? Number(overall.inProgress) : 0,
		},
		members: members?.map((member) => ({
			id: member.id,
			name: member.name,
			email: member.email,
			color: member.color,
			image: member.image,
			progress: {
				completed: member.completed ? Number(member.completed) : 0,
				inProgress: member.inProgress ? Number(member.inProgress) : 0,
			},
		})),
	};
};
