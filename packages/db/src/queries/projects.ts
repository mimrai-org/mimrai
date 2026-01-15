import { and, asc, desc, eq, ilike, or, type SQL, sql } from "drizzle-orm";
import { db } from "..";
import {
	milestones,
	projectMembers,
	type projectStatusEnum,
	projects,
	statuses,
	tasks,
	users,
} from "../schema";
import { createMilestone } from "./milestones";
import { cloneTask } from "./tasks";

export const getProjects = async ({
	search,
	teamId,
	userId,
	pageSize = 20,
	cursor,
}: {
	search?: string;
	teamId?: string;
	userId?: string;
	pageSize?: number;
	cursor?: string;
}) => {
	const whereClause: SQL[] = [];
	if (teamId) whereClause.push(eq(projects.teamId, teamId));
	if (search)
		whereClause.push(ilike(projects.name, `%${search.replace(/%/g, "\\%")}%`));

	// Filter by visibility: show if team-wide OR user is lead OR user is member OR user created it
	if (userId && teamId) {
		whereClause.push(
			or(
				eq(projects.visibility, "team"),
				eq(projects.leadId, userId),
				eq(projects.userId, userId),
				sql`${projects.id} IN (SELECT ${projectMembers.projectId} FROM ${projectMembers} WHERE ${projectMembers.userId} = ${userId})`,
			)!,
		);
	}

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

	const membersSubquery = db
		.select({
			projectId: projectMembers.projectId,
			members: sql<
				{ id: string; name: string; email: string; image: string | null }[]
			>`COALESCE(json_agg(jsonb_build_object('id', ${users.id}, 'name', ${users.name}, 'email', ${users.email}, 'image', ${users.image})) FILTER (WHERE ${users.id} IS NOT NULL), '[]'::json)`.as(
				"members",
			),
		})
		.from(projectMembers)
		.leftJoin(users, eq(projectMembers.userId, users.id))
		.groupBy(projectMembers.projectId)
		.as("members_sq");

	const leadSubquery = db
		.select({
			id: users.id,
			name: users.name,
			email: users.email,
			image: users.image,
		})
		.from(users)
		.as("lead_sq");

	const query = db
		.select({
			id: projects.id,
			name: projects.name,
			description: projects.description,
			color: projects.color,
			archived: projects.archived,
			startDate: projects.startDate,
			endDate: projects.endDate,
			leadId: projects.leadId,
			visibility: projects.visibility,
			lead: {
				id: leadSubquery.id,
				name: leadSubquery.name,
				email: leadSubquery.email,
				image: leadSubquery.image,
			},
			members: membersSubquery.members,
			status: projects.status,
			userId: projects.userId,
			memberIds: sql<
				string[]
			>`(SELECT ARRAY_AGG(${projectMembers.userId}) FROM ${projectMembers} WHERE ${projectMembers.projectId} = ${projects.id})`.as(
				"member_ids",
			),
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
		.leftJoin(membersSubquery, eq(projects.id, membersSubquery.projectId))
		.leftJoin(leadSubquery, eq(projects.leadId, leadSubquery.id))
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
			lead: project.lead?.id ? project.lead : null,
			members: project.members ?? [],
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
	memberIds,
	leadId,
	visibility,
	...input
}: {
	name: string;
	description?: string | null;
	color?: string | null;
	userId: string;
	teamId: string;
	leadId?: string | null;
	visibility?: "team" | "private" | null;
	memberIds?: string[] | null;
}) => {
	const [project] = await db
		.insert(projects)
		.values({
			...input,
			userId,
			teamId,
			...(leadId !== null && leadId !== undefined && { leadId }),
			...(visibility !== null && visibility !== undefined && { visibility }),
		})
		.returning();

	if (!project) throw new Error("Failed to create project");

	// Add project members if provided
	if (memberIds && memberIds.length > 0) {
		await db.insert(projectMembers).values(
			memberIds.map((memberId) => ({
				projectId: project.id,
				userId: memberId,
			})),
		);
	}

	return project;
};

export const getProjectById = async ({
	projectId,
	teamId,
	userId,
}: {
	projectId: string;
	teamId?: string;
	userId?: string;
}) => {
	const whereClause: SQL[] = [eq(projects.id, projectId)];
	if (teamId) whereClause.push(eq(projects.teamId, teamId));

	// Get project members
	const members = await db
		.select({
			id: users.id,
			name: users.name,
			email: users.email,
			image: users.image,
		})
		.from(projectMembers)
		.leftJoin(users, eq(projectMembers.userId, users.id))
		.where(eq(projectMembers.projectId, projectId));

	const [project] = await db
		.select({
			id: projects.id,
			name: projects.name,
			description: projects.description,
			color: projects.color,
			archived: projects.archived,
			startDate: projects.startDate,
			endDate: projects.endDate,
			leadId: projects.leadId,
			visibility: projects.visibility,
			status: projects.status,
			memberIds: sql<
				string[]
			>`(SELECT ARRAY_AGG(${projectMembers.userId}) FROM ${projectMembers} WHERE ${projectMembers.projectId} = ${projects.id})`.as(
				"member_ids",
			),
			userId: projects.userId,
			createdAt: projects.createdAt,
			updatedAt: projects.updatedAt,
		})
		.from(projects)
		.leftJoin(projectMembers, eq(projects.id, projectMembers.projectId))
		.where(and(...whereClause))
		.limit(1);

	if (!project) return null;

	// Check if user has access to private project
	if (userId && project.visibility === "private") {
		const hasAccess =
			project.leadId === userId ||
			project.userId === userId ||
			members.some((m) => m.id === userId);

		if (!hasAccess) {
			return null;
		}
	}

	return {
		...project,
		members,
	};
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
	memberIds,
	...input
}: {
	id: string;
	name?: string;
	color?: string;
	archived?: boolean;
	description?: string;
	status?: (typeof projectStatusEnum.enumValues)[number];
	teamId?: string;
	leadId?: string;
	visibility?: "team" | "private";
	memberIds?: string[] | null;
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

	// Update project members if provided
	if (memberIds !== undefined) {
		// Delete existing members
		await db.delete(projectMembers).where(eq(projectMembers.projectId, id));

		// Add new members
		if (memberIds && memberIds.length > 0) {
			await db.insert(projectMembers).values(
				memberIds.map((memberId) => ({
					projectId: id,
					userId: memberId,
				})),
			);
		}
	}

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
	userId,
}: {
	teamId: string;
	userId?: string;
}) => {
	const whereClause: SQL[] = [eq(projects.teamId, teamId)];

	// Filter by visibility if userId is provided
	if (userId) {
		whereClause.push(
			or(
				eq(projects.visibility, "team"),
				eq(projects.leadId, userId),
				eq(projects.userId, userId),
				sql`${projects.id} IN (SELECT ${projectMembers.projectId} FROM ${projectMembers} WHERE ${projectMembers.userId} = ${userId})`,
			)!,
		);
	}

	const projectsData = await db
		.select({
			id: projects.id,
			name: projects.name,
			archived: projects.archived,
			description: projects.description,
			color: projects.color,
			startDate: projects.startDate,
			endDate: projects.endDate,
			leadId: projects.leadId,
			visibility: projects.visibility,
			createdAt: projects.createdAt,
			updatedAt: projects.updatedAt,
		})
		.from(projects)
		.where(and(...whereClause))
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

/**
 * Check if a user has access to a project based on visibility rules
 */
export const canAccessProject = async ({
	projectId,
	userId,
	teamId,
}: {
	projectId: string;
	userId: string;
	teamId: string;
}): Promise<boolean> => {
	const [project] = await db
		.select({
			id: projects.id,
			visibility: projects.visibility,
			leadId: projects.leadId,
			userId: projects.userId,
		})
		.from(projects)
		.where(and(eq(projects.id, projectId), eq(projects.teamId, teamId)))
		.limit(1);

	if (!project) return false;

	// Team-wide projects are accessible to all team members
	if (project.visibility === "team") return true;

	// Project creator always has access
	if (project.userId === userId) return true;

	// Project lead always has access
	if (project.leadId === userId) return true;

	// Check if user is a project member
	const [member] = await db
		.select()
		.from(projectMembers)
		.where(
			and(
				eq(projectMembers.projectId, projectId),
				eq(projectMembers.userId, userId),
			),
		)
		.limit(1);

	return !!member;
};

/**
 * Get the list of project IDs that a user can access (for filtering tasks)
 */
export const getAccessibleProjectIds = async ({
	userId,
	teamId,
}: {
	userId: string;
	teamId: string;
}): Promise<string[]> => {
	// Get all team-wide projects
	const teamProjects = await db
		.select({ id: projects.id })
		.from(projects)
		.where(and(eq(projects.teamId, teamId), eq(projects.visibility, "team")));

	// Get private projects where user is lead or creator
	const ownedProjects = await db
		.select({ id: projects.id })
		.from(projects)
		.where(
			and(
				eq(projects.teamId, teamId),
				eq(projects.visibility, "private"),
				or(eq(projects.leadId, userId), eq(projects.userId, userId)),
			),
		);

	// Get private projects where user is a member
	const memberProjects = await db
		.select({ id: projectMembers.projectId })
		.from(projectMembers)
		.innerJoin(projects, eq(projectMembers.projectId, projects.id))
		.where(
			and(
				eq(projects.teamId, teamId),
				eq(projects.visibility, "private"),
				eq(projectMembers.userId, userId),
			),
		);

	const allProjectIds = new Set([
		...teamProjects.map((p) => p.id),
		...ownedProjects.map((p) => p.id),
		...memberProjects.map((p) => p.id),
	]);

	return Array.from(allProjectIds);
};

/**
 * Get all private project IDs that a user cannot access (for filtering tasks)
 */
export const getInaccessiblePrivateProjectIds = async ({
	userId,
	teamId,
}: {
	userId: string;
	teamId: string;
}): Promise<string[]> => {
	// Get all private projects in the team
	const allPrivateProjects = await db
		.select({ id: projects.id })
		.from(projects)
		.where(
			and(eq(projects.teamId, teamId), eq(projects.visibility, "private")),
		);

	// Get accessible private projects
	const accessiblePrivateIds = await db
		.select({ id: projects.id })
		.from(projects)
		.leftJoin(
			projectMembers,
			and(
				eq(projectMembers.projectId, projects.id),
				eq(projectMembers.userId, userId),
			),
		)
		.where(
			and(
				eq(projects.teamId, teamId),
				eq(projects.visibility, "private"),
				or(
					eq(projects.leadId, userId),
					eq(projects.userId, userId),
					sql`${projectMembers.userId} IS NOT NULL`,
				),
			),
		);

	const accessibleSet = new Set(accessiblePrivateIds.map((p) => p.id));
	return allPrivateProjects
		.filter((p) => !accessibleSet.has(p.id))
		.map((p) => p.id);
};

/**
 * Add a member to a project
 */
export const addProjectMember = async ({
	projectId,
	userId,
	teamId,
}: {
	projectId: string;
	userId: string;
	teamId: string;
}) => {
	// Verify the project exists and belongs to the team
	const project = await getProjectById({ projectId, teamId });
	if (!project) throw new Error("Project not found");

	const [result] = await db
		.insert(projectMembers)
		.values({
			projectId,
			userId,
		})
		.onConflictDoNothing()
		.returning();

	return result;
};

/**
 * Remove a member from a project
 */
export const removeProjectMember = async ({
	projectId,
	userId,
	teamId,
}: {
	projectId: string;
	userId: string;
	teamId: string;
}) => {
	// Verify the project exists and belongs to the team
	const project = await getProjectById({ projectId, teamId });
	if (!project) throw new Error("Project not found");

	await db
		.delete(projectMembers)
		.where(
			and(
				eq(projectMembers.projectId, projectId),
				eq(projectMembers.userId, userId),
			),
		);
};

/**
 * Get all members of a project
 */
export const getProjectMembers = async ({
	projectId,
	teamId,
}: {
	projectId: string;
	teamId: string;
}) => {
	// Verify the project exists and belongs to the team
	const project = await getProjectById({ projectId, teamId });
	if (!project) throw new Error("Project not found");

	const members = await db
		.select({
			id: users.id,
			name: users.name,
			email: users.email,
			image: users.image,
			color: users.color,
			createdAt: projectMembers.createdAt,
		})
		.from(projectMembers)
		.leftJoin(users, eq(projectMembers.userId, users.id))
		.where(eq(projectMembers.projectId, projectId));

	return members;
};
