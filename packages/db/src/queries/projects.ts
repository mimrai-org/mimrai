import {
	and,
	asc,
	desc,
	eq,
	ilike,
	inArray,
	not,
	type SQL,
	sql,
} from "drizzle-orm";
import { db } from "..";
import { milestones, projects, statuses, tasks, users } from "../schema";
import { createMilestone } from "./milestones";
import { cloneTask, createTask } from "./tasks";

export const getProjects = async ({
	search,
	teamId,
	pageSize = 20,
	cursor,
}: {
	search?: string;
	teamId?: string;
	pageSize?: number;
	cursor?: string;
}) => {
	const whereClause: SQL[] = [];
	if (teamId) whereClause.push(eq(projects.teamId, teamId));
	if (search)
		whereClause.push(ilike(projects.name, `%${search.replace(/%/g, "\\%")}%`));

	const progressSubquery = db
		.select({
			projectId: tasks.projectId,
			completed:
				sql<number>`COUNT(${tasks.id}) FILTER (WHERE ${statuses.type} = 'done')`.as(
					"completed",
				),
			inProgress:
				sql<number>`COUNT(${tasks.id}) FILTER (WHERE ${statuses.type} IN ('in_progress', 'review', 'to_do', 'backlog'))`.as(
					"in_progress",
				),
		})
		.from(tasks)
		.innerJoin(statuses, eq(tasks.statusId, statuses.id))
		.groupBy(tasks.projectId)
		.as("progress_sq");

	const milestonesSubquery = db
		.select({
			id: milestones.id,
			name: milestones.name,
			dueDate: milestones.dueDate,
			color: milestones.color,
			projectId: milestones.projectId,
		})
		.from(milestones)
		.where(and(eq(milestones.projectId, projects.id)))
		.orderBy(desc(milestones.dueDate))
		.groupBy(milestones.id)
		.limit(1)
		.as("milestones_sq");

	const query = db
		.select({
			id: projects.id,
			name: projects.name,
			description: projects.description,
			color: projects.color,
			archived: projects.archived,
			startDate: projects.startDate,
			endDate: projects.endDate,
			progress: {
				completed: progressSubquery.completed,
				inProgress: progressSubquery.inProgress,
			},
			milestone: {
				id: milestonesSubquery.id,
				name: milestonesSubquery.name,
				dueDate: milestonesSubquery.dueDate,
				color: milestonesSubquery.color,
			},
			createdAt: projects.createdAt,
			updatedAt: projects.updatedAt,
		})
		.from(projects)
		.leftJoin(progressSubquery, eq(projects.id, progressSubquery.projectId))
		.leftJoinLateral(milestonesSubquery, sql`TRUE`)
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
	description?: string | null;
	color?: string | null;
	userId: string;
	teamId: string;
}) => {
	const [project] = await db
		.insert(projects)
		.values({
			...input,
			userId,
			teamId,
		})
		.returning();

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
			startDate: projects.startDate,
			endDate: projects.endDate,
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

	const [result] = await db
		.update(projects)
		.set({
			...input,
			updatedAt: new Date().toISOString(),
		})
		.where(and(...whereClause))
		.returning();
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
				sql<number>`COUNT(${tasks.id}) FILTER (WHERE ${statuses.type} = 'done')`.as(
					"completed",
				),
			inProgress:
				sql<number>`COUNT(${tasks.id}) FILTER (WHERE ${statuses.type} NOT IN ('done'))`.as(
					"in_progress",
				),
		})
		.from(projects)
		.leftJoin(tasks, eq(projects.id, tasks.projectId))
		.leftJoin(statuses, eq(tasks.statusId, statuses.id))
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
				sql<number>`COUNT(${tasks.id}) FILTER (WHERE ${statuses.type} = 'done')`.as(
					"completed",
				),
			inProgress:
				sql<number>`COUNT(${tasks.id}) FILTER (WHERE ${statuses.type} NOT IN ('done'))`.as(
					"in_progress",
				),
		})
		.from(projects)
		.innerJoin(tasks, eq(projects.id, tasks.projectId))
		.innerJoin(statuses, eq(tasks.statusId, statuses.id))
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

export const getProjectsForTimeline = async ({
	teamId,
}: {
	teamId: string;
}) => {
	const projectsData = await db
		.select({
			id: projects.id,
			name: projects.name,
			archived: projects.archived,
			description: projects.description,
			color: projects.color,
			startDate: projects.startDate,
			endDate: projects.endDate,
			createdAt: projects.createdAt,
			updatedAt: projects.updatedAt,
		})
		.from(projects)
		.where(eq(projects.teamId, teamId))
		.orderBy(asc(projects.startDate));

	const milestonesData = await db
		.select({
			id: milestones.id,
			name: milestones.name,
			dueDate: milestones.dueDate,
			color: milestones.color,
			projectId: milestones.projectId,
		})
		.from(milestones)
		.where(eq(milestones.teamId, teamId))
		.orderBy(asc(milestones.dueDate));

	return projectsData.map((project) => ({
		...project,
		milestones: milestonesData.filter((m) => m.projectId === project.id),
	}));
};

export const cloneProject = async ({
	projectId,
	userId,
	teamId,
}: {
	projectId: string;
	userId: string;
	teamId: string;
}) => {
	const project = await getProjectById({ projectId, teamId });
	if (!project) throw new Error("Project not found");

	const newProject = await createProject({
		name: `${project.name} (Copy)`,
		description: project.description,
		color: project.color,
		userId,
		teamId,
	});

	if (!newProject) throw new Error("Failed to create project");

	// Clone milestones
	const projectMilestones = await db
		.select()
		.from(milestones)
		.where(
			and(eq(milestones.projectId, projectId), eq(milestones.teamId, teamId)),
		);

	const newMilestones = await Promise.all(
		projectMilestones.map((milestone) =>
			createMilestone({
				name: milestone.name,
				dueDate: milestone.dueDate,
				color: milestone.color,
				projectId: newProject.id,
				teamId,
			}),
		),
	);

	// Create a map of old milestone IDs to new milestone IDs
	const newMilestoneMap: Map<string, string> = new Map();
	for (const milestone of projectMilestones) {
		if (newMilestoneMap.has(milestone.name)) continue;
		const newMilestone = newMilestones.find(
			(m) => m?.name === milestone.name && m?.dueDate === milestone.dueDate,
		);
		if (newMilestone) {
			newMilestoneMap.set(milestone.id, newMilestone.id);
		}
	}

	// Clone tasks
	const projectTasks = await db
		.select()
		.from(tasks)
		.where(and(eq(tasks.projectId, projectId), eq(tasks.teamId, teamId)));

	await Promise.all(
		projectTasks.map((task) =>
			cloneTask({
				taskId: task.id,
				userId,
				teamId,
				projectId: newProject.id,
				milestoneId: newMilestoneMap.get(task.milestoneId || "") || null,
			}),
		),
	);

	return newProject;
};
