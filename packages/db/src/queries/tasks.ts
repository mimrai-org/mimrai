import type { MagicTaskAction } from "@mimir/utils/pr-reviews";
import { getTaskPermalink } from "@mimir/utils/tasks";
import { subDays } from "date-fns";
import {
	and,
	asc,
	desc,
	eq,
	gte,
	inArray,
	isNotNull,
	isNull,
	lte,
	notInArray,
	or,
	type SQL,
	sql,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import { db } from "..";
import {
	activities,
	type activityStatusEnum,
	checklistItems,
	labels,
	labelsOnTasks,
	milestones,
	projectMembers,
	projects,
	statuses,
	type statusTypeEnum,
	tasks,
	tasksDependencies,
	users,
	usersOnTeams,
} from "../schema";
import { unionArray } from "../utils/array";
import { jsonAggBuildObject } from "../utils/drizzle";
import { buildSearchQuery } from "../utils/search-query";
import {
	createActivity,
	createTaskUpdateActivity,
	deleteActivity,
	updateActivity,
} from "./activities";
import { getStatuses } from "./statuses";
import { upsertTaskEmbedding } from "./tasks-embeddings";
import { getMembers } from "./teams";

type TaskLabel = {
	id: string;
	name: string;
	color: string;
};

type TaskChecklistItem = {
	id: string;
	description: string;
	isCompleted: boolean;
	assigneeId: string | null;
};

export const getNextTaskSequence = async (teamId: string) => {
	const [result] = await db
		.select({
			maxSequence: sql<number>`MAX(${tasks.sequence}) + 1`,
			maxOrder: sql<number>`MAX(${tasks.order}) + 1`,
		})
		.from(tasks)
		.where(eq(tasks.teamId, teamId))
		.limit(1);

	return {
		sequence: result?.maxSequence ?? 0,
		order: result?.maxOrder ?? 6000,
	};
};

export const generateTaskPermalinkId = async (size = 12): Promise<string> => {
	const value = nanoid(size);
	const [existingTask] = await db
		.select({ exists: sql<boolean>`COUNT(*) > 0` })
		.from(tasks)
		.where(eq(tasks.permalinkId, value));
	if (existingTask?.exists) {
		return generateTaskPermalinkId(size + 1);
	}
	return value;
};

export const getTasks = async ({
	pageSize = 20,
	cursor,
	...input
}: {
	pageSize?: number;
	cursor?: string;
	assigneeId?: string[];
	statusId?: string[];
	statusType?: (typeof statusTypeEnum.enumValues)[number][];
	labels?: string[];
	teamId?: string;
	userId?: string;
	projectId?: string[];
	milestoneId?: string[];
	nProjectId?: string[];
	statusChangedAt?: [Date?, Date?, ...unknown[]];
	createdAt?: [Date?, Date?, ...unknown[]];
	completedBy?: string[];
	search?: string;
	recurring?: boolean;
	view?: "board" | "list" | "calendar";
}) => {
	const whereClause: (SQL | undefined)[] = [];

	const assigneesConcat = `${input.assigneeId?.join(",")}`;
	const assigneeIdsWithMe = input.assigneeId
		?.map((id) => (id === "me" ? input.userId : id))
		.filter(Boolean) as string[];

	console.log(assigneeIdsWithMe);

	assigneeIdsWithMe &&
		assigneeIdsWithMe.length > 0 &&
		whereClause.push(
			or(
				inArray(tasks.assigneeId, assigneeIdsWithMe),
				// filter by any checklist item assignee
				sql`${tasks.id} IN (SELECT ${checklistItems.taskId} FROM ${checklistItems} WHERE ${checklistItems.assigneeId} IN (${assigneesConcat}) AND ${checklistItems.isCompleted} = false)`,
			),
		);
	input.statusId && whereClause.push(inArray(tasks.statusId, input.statusId));
	input.statusType &&
		whereClause.push(inArray(statuses.type, input.statusType));
	input.teamId && whereClause.push(eq(tasks.teamId, input.teamId));
	input.milestoneId &&
		input.milestoneId.length > 0 &&
		whereClause.push(inArray(tasks.milestoneId, input.milestoneId));
	input.statusChangedAt?.[0] &&
		input.statusChangedAt?.[1] &&
		whereClause.push(
			and(
				gte(tasks.statusChangedAt, input.statusChangedAt[0]),
				lte(tasks.statusChangedAt, input.statusChangedAt[1]),
			),
		);
	input.completedBy &&
		input.completedBy.length > 0 &&
		whereClause.push(inArray(tasks.completedBy, input.completedBy));

	input.createdAt?.[0] &&
		input.createdAt?.[1] &&
		whereClause.push(
			and(
				gte(tasks.createdAt, input.createdAt[0].toISOString()),
				lte(tasks.createdAt, input.createdAt[1].toISOString()),
			),
		);

	input.recurring && whereClause.push(isNotNull(tasks.recurringJobId));
	input.projectId &&
		input.projectId.length > 0 &&
		whereClause.push(inArray(tasks.projectId, input.projectId));
	input.nProjectId &&
		input.nProjectId.length > 0 &&
		whereClause.push(
			or(
				notInArray(tasks.projectId, input.nProjectId),
				isNull(tasks.projectId),
			),
		);

	// Filter by project visibility:
	// - Show tasks with no project
	// - Show tasks from team-wide projects
	// - Show tasks from private projects where user is assigned
	// - Show tasks from private projects where user is lead/member/creator
	if (input.userId && input.teamId) {
		whereClause.push(
			or(
				// Tasks with no project
				isNull(tasks.projectId),
				// Tasks from team-wide projects
				sql`${tasks.projectId} IN (
					SELECT ${projects.id} FROM ${projects}
					WHERE ${projects.visibility} = 'team'
					AND ${projects.teamId} = ${input.teamId}
				)`,
				// Tasks explicitly assigned to the user (even in private projects)
				eq(tasks.assigneeId, input.userId),
				// Tasks from private projects where user is lead, creator or member
				sql`${tasks.projectId} IN (
					SELECT ${projects.id} FROM ${projects}
					LEFT JOIN ${projectMembers} ON ${projectMembers.projectId} = ${projects.id}
					WHERE ${projects.visibility} = 'private'
					AND ${projects.teamId} = ${input.teamId}
					AND (
						${projects.leadId} = ${input.userId}
						OR ${projects.userId} = ${input.userId}
						OR ${projectMembers.userId} = ${input.userId}
					)
				)`,
			),
		);
	}

	if (input.search) {
		// Check if the search input is a UUID
		const isUUID =
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
				input.search,
			);

		if (isUUID) {
			whereClause.push(eq(tasks.id, input.search));
		} else if (!Number.isNaN(Number.parseInt(input.search, 10))) {
			whereClause.push(eq(tasks.sequence, Number.parseInt(input.search, 10)));
		} else {
			const query = buildSearchQuery(input.search);
			whereClause.push(
				sql`(to_tsquery('english', unaccent(${query})) @@ ${tasks.fts})`,
			);
		}
	}

	// exclude done tasks with more than 3 days
	if (input.view === "board") {
		whereClause.push(
			or(
				notInArray(statuses.type, ["done"]),
				and(
					eq(statuses.type, "done"),
					gte(tasks.updatedAt, subDays(new Date(), 3).toISOString()),
				),
			),
		);
	}

	const checklistSubquery = db
		.select({
			taskId: checklistItems.taskId,
			completed:
				sql<number>`COUNT(CASE WHEN ${checklistItems.isCompleted} = true THEN 1 END)`.as(
					"completed",
				),
			total: sql<number>`COUNT(${checklistItems.id})`.as("total"),
			checklist: sql<
				TaskChecklistItem[]
			>`COALESCE(json_agg(jsonb_build_object('id', ${checklistItems.id}, 'description', ${checklistItems.description}, 'isCompleted', ${checklistItems.isCompleted}, 'assigneeId', ${checklistItems.assigneeId}) ) FILTER (WHERE ${checklistItems.id} IS NOT NULL), '[]'::json)`.as(
				"checklist",
			),
		})
		.from(checklistItems)
		.groupBy(checklistItems.taskId)
		.as("checklist_subquery");

	const labelsSubquery = db
		.select({
			taskId: labelsOnTasks.taskId,
			labels: sql<
				TaskLabel[]
			>`COALESCE(json_agg(jsonb_build_object('id', ${labels.id}, 'name', ${labels.name}, 'color', ${labels.color}) ) FILTER (WHERE ${labels.id} IS NOT NULL), '[]'::json)`.as(
				"labels",
			),
		})
		.from(labelsOnTasks)
		.leftJoin(labels, eq(labels.id, labelsOnTasks.labelId))
		.groupBy(labelsOnTasks.taskId)
		.as("labels_subquery");

	input.labels &&
		input.labels.length > 0 &&
		whereClause.push(
			sql`${tasks.id} IN (SELECT ${labelsOnTasks.taskId} FROM ${labelsOnTasks} WHERE ${labelsOnTasks.labelId} = ANY(ARRAY[${input.labels.join(",")}]))`,
		);

	const dependsOnTask = alias(tasks, "depends_on_task");
	const dependenciesSubquery = db
		.select({
			dependencies: jsonAggBuildObject({
				taskId: tasksDependencies.taskId,
				dependsOnTaskId: tasksDependencies.dependsOnTaskId,
				type: tasksDependencies.type,
				statusType: statuses.type,
			}).as("dependencies"),
		})
		.from(tasksDependencies)
		.innerJoin(dependsOnTask, eq(tasksDependencies.taskId, dependsOnTask.id))
		.innerJoin(statuses, eq(dependsOnTask.statusId, statuses.id))
		.where(
			or(
				eq(tasksDependencies.dependsOnTaskId, tasks.id),
				eq(tasksDependencies.taskId, tasks.id),
			),
		)
		.as("dependencies");

	const query = db
		.select({
			id: tasks.id,
			title: tasks.title,
			description: tasks.description,
			assigneeId: tasks.assigneeId,
			sequence: tasks.sequence,
			projectId: tasks.projectId,
			permalinkId: tasks.permalinkId,
			milestoneId: tasks.milestoneId,
			subscribers: tasks.subscribers,
			statusChangedAt: tasks.statusChangedAt,
			completedAt: tasks.completedAt,
			completedBy: tasks.completedBy,
			milestone: {
				id: milestones.id,
				name: milestones.name,
				color: milestones.color,
			},
			project: {
				id: projects.id,
				name: projects.name,
				color: projects.color,
			},
			assignee: {
				id: users.id,
				name: users.name,
				email: users.email,
				image: users.image,
				color: users.color,
			},
			statusId: tasks.statusId,
			repositoryName: tasks.repositoryName,
			branchName: tasks.branchName,
			order: tasks.order,
			priority: tasks.priority,
			focusOrder: tasks.focusOrder,
			focusReason: tasks.focusReason,
			dueDate: tasks.dueDate,
			createdAt: tasks.createdAt,
			updatedAt: tasks.updatedAt,
			teamId: tasks.teamId,
			attachments: tasks.attachments,
			checklistSummary: {
				completed: checklistSubquery.completed,
				total: checklistSubquery.total,
				checklist: checklistSubquery.checklist,
			},
			recurring: tasks.recurring,
			recurringJobId: tasks.recurringJobId,
			recurringNextDate: tasks.recurringNextDate,
			status: {
				id: statuses.id,
				name: statuses.name,
				description: statuses.description,
				order: statuses.order,
				type: statuses.type,
			},
			labels: labelsSubquery.labels,
			dependencies: dependenciesSubquery.dependencies,
		})
		.from(tasks)
		.where(and(...whereClause))
		.innerJoin(statuses, eq(tasks.statusId, statuses.id))
		.leftJoin(labelsSubquery, eq(labelsSubquery.taskId, tasks.id))
		.leftJoin(users, eq(tasks.assigneeId, users.id))
		.leftJoin(checklistSubquery, eq(checklistSubquery.taskId, tasks.id))
		.leftJoin(projects, eq(tasks.projectId, projects.id))
		.leftJoin(milestones, eq(tasks.milestoneId, milestones.id))
		.leftJoinLateral(dependenciesSubquery, sql`true`);

	if (input.view === "board") {
		query.orderBy(
			asc(
				sql`CASE ${tasks.priority} WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 END`,
			),
			asc(tasks.focusOrder),
			desc(tasks.dueDate),
			tasks.order,
			tasks.sequence,
		);
	} else if (input.view === "list") {
		query.orderBy(
			asc(
				sql`CASE ${tasks.priority} WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 END`,
			),
			asc(tasks.focusOrder),
			desc(tasks.dueDate),
			desc(tasks.createdAt),
		);
	} else {
		query.orderBy(desc(tasks.createdAt));
	}

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

export interface CreateTaskInput {
	labels?: string[];
	title: string;
	description?: string;
	assigneeId?: string;
	statusId: string;
	milestoneId?: string | null;
	teamId: string;
	order?: number;
	priority?: "low" | "medium" | "high" | "urgent";
	repositoryName?: string;
	branchName?: string;
	dueDate?: string;
	attachments?: string[];
	mentions?: string[];
	projectId: string | null;
	userId?: string;
	recurring?: {
		startDate?: string;
		frequency: "daily" | "weekly" | "monthly" | "yearly";
		interval: number;
	};
}

export const createTask = async ({
	labels,
	userId,
	...input
}: CreateTaskInput) => {
	const { sequence, order } = await getNextTaskSequence(input.teamId);
	const permalinkId = await generateTaskPermalinkId();

	const [task] = await db
		.insert(tasks)
		.values({
			...input,
			milestoneId: input.projectId === null ? null : input.milestoneId,
			sequence,
			permalinkId,
			order,
			subscribers: unionArray([
				userId,
				input.assigneeId,
				...(input.mentions ?? []),
			]),
		})
		.returning();

	if (labels && labels.length > 0 && task) {
		// Then, insert new labels
		const labelInserts = labels.map((labelId) => ({
			taskId: task.id,
			labelId,
		}));
		await db.insert(labelsOnTasks).values(labelInserts);
	}

	if (!task) {
		throw new Error("Failed to create task");
	}

	createActivity({
		userId,
		teamId: task.teamId,
		type: "task_created",
		metadata: {
			title: task.title,
		},
		groupId: task.id,
	});

	await upsertTaskEmbedding({
		task,
		teamId: task.teamId,
	});

	return task;
};

export const deleteTask = async (input: { id: string; teamId?: string }) => {
	const whereClause: SQL[] = [eq(tasks.id, input.id)];

	if (input.teamId) {
		whereClause.push(eq(tasks.teamId, input.teamId));
	}

	const [task] = await db
		.delete(tasks)
		.where(and(...whereClause))
		.returning();

	if (!task) {
		throw new Error("Failed to delete task");
	}

	return task;
};

export const updateTask = async ({
	labels,
	userId,
	...input
}: {
	id: string;
	labels?: string[];
	title?: string;
	description?: string;
	assigneeId?: string | null;
	statusId?: string;
	teamId?: string;
	order?: number;
	focusOrder?: number | null;
	priority?: "low" | "medium" | "high" | "urgent";
	repositoryName?: string;
	branchName?: string;
	dueDate?: string;
	attachments?: string[];
	mentions?: string[];
	userId?: string;
	projectId?: string | null;
	milestoneId?: string | null;
	prReviewId?: string;
	recurring?: {
		startDate?: string;
		frequency: "daily" | "weekly" | "monthly" | "yearly";
		interval: number;
	};
}) => {
	const whereClause: SQL[] = [eq(tasks.id, input.id)];

	if (input.teamId) {
		whereClause.push(eq(tasks.teamId, input.teamId));
	}

	const [oldTask] = await db
		.select()
		.from(tasks)
		.where(and(...whereClause))
		.limit(1);

	if (!oldTask) {
		throw new Error("Task not found");
	}

	const [task] = await db
		.update(tasks)
		.set({
			...input,
			milestoneId: input.projectId === null ? null : input.milestoneId,
			updatedAt: new Date().toISOString(),
			subscribers: unionArray(oldTask.subscribers, [
				input.assigneeId,
				...(input.mentions ?? []),
			]),
		})
		.where(and(...whereClause))
		.returning();

	if (labels) {
		// First, delete existing labels for the task
		await db.delete(labelsOnTasks).where(eq(labelsOnTasks.taskId, input.id));

		// Then, insert new labels
		if (labels.length > 0) {
			const labelInserts = labels.map((labelId) => ({
				taskId: input.id,
				labelId,
			}));
			await db.insert(labelsOnTasks).values(labelInserts);
		}
	}

	if (!task) {
		throw new Error("Failed to update task");
	}

	// Update task embedding if title has changed
	if (task.title !== oldTask.title) {
		upsertTaskEmbedding({
			task,
			teamId: task.teamId,
		});
	}

	createTaskUpdateActivity({
		oldTask,
		newTask: task,
		teamId: task.teamId,
		userId,
	});

	return task;
};

export const bulkUpdateTask = async ({
	ids,
	userId,
	teamId,
	...input
}: {
	ids: string[];
	title?: string;
	description?: string;
	assigneeId?: string | null;
	statusId?: string;
	projectId?: string | null;
	milestoneId?: string | null;
	priority?: "low" | "medium" | "high" | "urgent";
	repositoryName?: string;
	branchName?: string;
	dueDate?: string;
	userId: string;
	teamId: string;
}) => {
	const whereClause: SQL[] = [inArray(tasks.id, ids), eq(tasks.teamId, teamId)];

	// Get old tasks for activity logging
	const oldTasks = await db
		.select()
		.from(tasks)
		.where(and(...whereClause));

	if (oldTasks.length === 0) {
		throw new Error("No tasks found");
	}

	const updateData: any = {
		...input,
		milestoneId: input.projectId === null ? null : input.milestoneId,
		updatedAt: new Date().toISOString(),
	};

	// Handle subscribers: add assignee if set
	if (input.assigneeId) {
		updateData.subscribers = sql`array_cat(subscribers, ARRAY[${input.assigneeId}])`;
	}

	const updatedTasks = await db
		.update(tasks)
		.set(updateData)
		.where(and(...whereClause))
		.returning();

	if (updatedTasks.length !== ids.length) {
		throw new Error("Failed to update all tasks");
	}

	// Create activities for each updated task
	for (const oldTask of oldTasks) {
		const newTask = updatedTasks.find((t) => t.id === oldTask.id);
		if (newTask) {
			createTaskUpdateActivity({
				oldTask,
				newTask,
				teamId,
				userId,
			});
		}
	}

	return updatedTasks;
};

export const getTaskByPermalinkId = async (
	permalinkId: string,
	userId?: string,
) => {
	const whereClause: SQL[] = [
		or(eq(tasks.permalinkId, permalinkId), eq(tasks.id, permalinkId))!,
	];

	if (userId) {
		whereClause.push(eq(usersOnTeams.userId, userId));
	}

	const [task] = await db
		.select({
			id: tasks.id,
			teamId: tasks.teamId,
			projectId: tasks.projectId,
		})
		.from(tasks)
		.where(and(...whereClause))
		.innerJoin(usersOnTeams, eq(usersOnTeams.teamId, tasks.teamId))
		.limit(1);

	return task;
};

export const getTaskById = async (id: string, userId?: string) => {
	const whereClause: SQL[] = [eq(tasks.id, id)];

	if (userId) {
		whereClause.push(eq(usersOnTeams.userId, userId));
	}

	const labelsSubquery = db
		.select({
			taskId: labelsOnTasks.taskId,
			labels: sql<
				TaskLabel[]
			>`COALESCE(json_agg(jsonb_build_object('id', ${labels.id}, 'name', ${labels.name}, 'color', ${labels.color}) ) FILTER (WHERE ${labels.id} IS NOT NULL), '[]'::json)`.as(
				"labels",
			),
		})
		.from(labelsOnTasks)
		.where(eq(labelsOnTasks.taskId, id))
		.leftJoin(labels, eq(labels.id, labelsOnTasks.labelId))
		.groupBy(labelsOnTasks.taskId)
		.as("labels_subquery");

	const checklistSubquery = db
		.select({
			taskId: checklistItems.taskId,
			completed:
				sql<number>`COUNT(CASE WHEN ${checklistItems.isCompleted} = true THEN 1 END)`.as(
					"completed",
				),
			total: sql<number>`COUNT(${checklistItems.id})`.as("total"),
			checklist: sql<
				TaskChecklistItem[]
			>`COALESCE(json_agg(jsonb_build_object('id', ${checklistItems.id}, 'description', ${checklistItems.description}, 'isCompleted', ${checklistItems.isCompleted}, 'assigneeId', ${checklistItems.assigneeId}) ) FILTER (WHERE ${checklistItems.id} IS NOT NULL), '[]'::json)`.as(
				"checklist",
			),
		})
		.from(checklistItems)
		.groupBy(checklistItems.taskId)
		.as("checklist_subquery");

	const [task] = await db
		.select({
			id: tasks.id,
			title: tasks.title,
			description: tasks.description,
			assigneeId: tasks.assigneeId,
			sequence: tasks.sequence,
			projectId: tasks.projectId,
			subscribers: tasks.subscribers,
			statusChangedAt: tasks.statusChangedAt,
			completedAt: tasks.completedAt,
			completedBy: tasks.completedBy,
			project: {
				id: projects.id,
				name: projects.name,
				color: projects.color,
			},
			milestoneId: tasks.milestoneId,
			milestone: {
				id: milestones.id,
				name: milestones.name,
				color: milestones.color,
			},
			assignee: {
				id: users.id,
				name: users.name,
				email: users.email,
				image: users.image,
				color: users.color,
			},
			checklistSummary: {
				completed: checklistSubquery.completed,
				total: checklistSubquery.total,
				checklist: checklistSubquery.checklist,
			},
			statusId: tasks.statusId,
			order: tasks.order,
			priority: tasks.priority,
			repositoryName: tasks.repositoryName,
			branchName: tasks.branchName,
			dueDate: tasks.dueDate,
			createdAt: tasks.createdAt,
			updatedAt: tasks.updatedAt,
			teamId: tasks.teamId,
			attachments: tasks.attachments,
			permalinkId: tasks.permalinkId,
			focusOrder: tasks.focusOrder,
			focusReason: tasks.focusReason,
			recurring: tasks.recurring,
			recurringJobId: tasks.recurringJobId,
			recurringNextDate: tasks.recurringNextDate,
			status: {
				id: statuses.id,
				name: statuses.name,
				description: statuses.description,
				order: statuses.order,
				type: statuses.type,
			},
			labels: labelsSubquery.labels,
		})
		.from(tasks)
		.where(and(...whereClause))
		.innerJoin(statuses, eq(tasks.statusId, statuses.id))
		.innerJoin(usersOnTeams, eq(usersOnTeams.teamId, tasks.teamId))
		.leftJoin(checklistSubquery, eq(checklistSubquery.taskId, tasks.id))
		.leftJoin(labelsSubquery, eq(labelsSubquery.taskId, tasks.id))
		.leftJoin(users, eq(tasks.assigneeId, users.id))
		.leftJoin(projects, eq(tasks.projectId, projects.id))
		.leftJoin(milestones, eq(tasks.milestoneId, milestones.id))
		.limit(1);

	return task;
};

export const createDefaultTasks = async ({
	statusId,
	labelId,
	assigneeId,
	teamId,
}: {
	statusId: string;
	labelId: string;
	assigneeId: string;
	teamId: string;
}) => {
	const defaultTasks = [
		{
			title: "Welcome to Mimir!",
			description: "This is your first task. Feel free to edit or delete it.",
		},
	];

	let index = 1;
	for (const d of defaultTasks) {
		index++;
		const data = await db
			.insert(tasks)
			.values({
				...d,
				statusId,
				teamId,
				assigneeId,
				permalinkId: await generateTaskPermalinkId(),
				order: index,
			})
			.returning();

		for (const task of data) {
			await db.insert(labelsOnTasks).values({ taskId: task.id, labelId });
		}
	}

	return [];
};

export const createTaskComment = async ({
	taskId,
	replyTo,
	userId,
	teamId,
	comment,
	mentions = [],
	metadata,
}: {
	taskId: string;
	userId?: string;
	teamId?: string;
	replyTo?: string;
	comment: string;
	metadata?: Record<string, any>;
	mentions?: string[];
}) => {
	const whereClause: SQL[] = [eq(tasks.id, taskId)];

	if (teamId) whereClause.push(eq(tasks.teamId, teamId));

	const [task] = await db
		.select()
		.from(tasks)
		.where(and(...whereClause))
		.limit(1);

	if (!task) {
		throw new Error("Task not found");
	}

	const [newTask] = await db
		.update(tasks)
		.set({
			subscribers: unionArray(task.subscribers, [userId, ...mentions]),
		})
		.where(and(...whereClause))
		.returning();

	if (!newTask) {
		throw new Error("Failed to add comment to task");
	}

	const activity = await createActivity({
		userId,
		teamId: task.teamId,
		type: "task_comment",
		groupId: replyTo ?? task.id,
		metadata: {
			comment,
			title: task.title,
			subscribers: newTask.subscribers,
			...metadata,
		},
	});

	return activity;
};

export const deleteTaskComment = async ({
	teamId,
	commentId,
}: {
	teamId?: string;
	commentId: string;
}) => {
	return deleteActivity({
		id: commentId,
		teamId,
	});
};

export const updateTaskComment = async ({
	taskId,
	userId,
	teamId,
	commentId,
	status,
	comment,
	mentions = [],
}: {
	taskId: string;
	userId?: string;
	teamId?: string;
	commentId: string;
	status?: (typeof activityStatusEnum.enumValues)[number];
	comment?: string;
	mentions?: string[];
}) => {
	const whereClause: SQL[] = [eq(tasks.id, taskId)];

	if (teamId) whereClause.push(eq(tasks.teamId, teamId));

	const [task] = await db
		.select()
		.from(tasks)
		.where(and(...whereClause))
		.limit(1);

	if (!task) {
		throw new Error("Task not found");
	}

	await db
		.update(tasks)
		.set({
			subscribers: unionArray(task.subscribers, [userId, ...mentions]),
		})
		.where(and(...whereClause))
		.returning();

	const [existingActivity] = await db
		.select()
		.from(activities)
		.where(
			and(eq(activities.id, commentId), eq(activities.type, "task_comment")),
		)
		.limit(1);

	if (!existingActivity) {
		throw new Error("Comment not found");
	}

	return updateActivity({
		id: commentId,
		teamId,
		status,
		metadata: {
			...existingActivity.metadata,
			comment,
			title: task.title,
		},
	});
};

export const getTaskByTitle = async ({
	title,
	teamId,
}: {
	title: string;
	teamId: string;
}) => {
	const [task] = await db
		.select()
		.from(tasks)
		.where(and(eq(tasks.title, title), eq(tasks.teamId, teamId)))
		.limit(1);
	return task;
};

export const subscribeUserToTask = async ({
	taskId,
	userId,
	teamId,
}: {
	taskId: string;
	userId: string;
	teamId?: string;
}) => {
	const whereClause: SQL[] = [eq(tasks.id, taskId)];

	if (teamId) {
		whereClause.push(eq(tasks.teamId, teamId));
	}

	const [oldTask] = await db
		.select()
		.from(tasks)
		.where(and(...whereClause))
		.limit(1);

	if (!oldTask) {
		throw new Error("Task not found");
	}

	const [task] = await db
		.update(tasks)
		.set({
			subscribers: unionArray(oldTask.subscribers, [userId]),
		})
		.where(and(...whereClause))
		.returning();

	if (!task) {
		throw new Error("Failed to subscribe to task");
	}

	return task;
};

export const unsubscribeUserFromTask = async ({
	taskId,
	userId,
	teamId,
}: {
	taskId: string;
	userId: string;
	teamId?: string;
}) => {
	const whereClause: SQL[] = [eq(tasks.id, taskId)];

	if (teamId) {
		whereClause.push(eq(tasks.teamId, teamId));
	}

	const [oldTask] = await db
		.select()
		.from(tasks)
		.where(and(...whereClause))
		.limit(1);

	if (!oldTask) {
		throw new Error("Task not found");
	}

	const updatedSubscribers = oldTask.subscribers.filter((id) => id !== userId);

	const [task] = await db
		.update(tasks)
		.set({
			subscribers: updatedSubscribers,
		})
		.where(and(...whereClause))
		.returning();

	if (!task) {
		throw new Error("Failed to unsubscribe from task");
	}

	return task;
};

export const getTaskSubscribers = async ({
	taskId,
	teamId,
}: {
	taskId: string;
	teamId?: string;
}) => {
	const whereClause: SQL[] = [
		eq(tasks.id, taskId),
		sql`${users.id} = ANY(${tasks.subscribers})`,
	];

	if (teamId) {
		whereClause.push(eq(tasks.teamId, teamId));
	}

	const subscribers = await db
		.select({
			id: users.id,
			name: users.name,
			email: users.email,
			image: users.image,
			color: users.color,
		})
		.from(users)
		.innerJoin(tasks, and(...whereClause));

	return subscribers;
};

export const updateTaskRecurringJob = async ({
	taskId,
	jobId,
	nextOccurrenceDate,
}: {
	taskId: string;
	jobId: string | null;
	nextOccurrenceDate?: string;
}) => {
	const [task] = await db
		.update(tasks)
		.set({
			recurringJobId: jobId,
			recurringNextDate: nextOccurrenceDate,
		})
		.where(eq(tasks.id, taskId))
		.returning();
	if (!task) {
		throw new Error("Failed to link recurring job to task");
	}
	return task;
};

export const cloneTask = async ({
	taskId,
	teamId,
	userId,
	...input
}: {
	taskId: string;
	teamId: string;
	userId: string;
	projectId?: string | null;
	milestoneId?: string | null;
}) => {
	const task = await getTaskById(taskId, userId);
	if (!task) throw new Error("Task not found");

	const newTask = await createTask({
		title: task.title,
		description: task.description!,
		assigneeId: task.assigneeId!,
		statusId: task.statusId,
		order: task.order,
		priority: task.priority,
		labels: task.labels?.map((label) => label.id),
		projectId: input.projectId || task.projectId,
		milestoneId: input.milestoneId || task.milestoneId,
		repositoryName: task.repositoryName!,
		branchName: task.branchName!,
		teamId,
		userId,
		dueDate: task.dueDate!,
		recurring: task.recurring!,
		attachments: task.attachments!,
	});

	const items = await db
		.select()
		.from(checklistItems)
		.where(eq(checklistItems.taskId, taskId));

	await Promise.all(
		items.map((item) =>
			db.insert(checklistItems).values({
				taskId: newTask.id,
				description: item.description,
				isCompleted: false,
				assigneeId: item.assigneeId,
				teamId,
				attachments: item.attachments,
			}),
		),
	);

	return newTask;
};

export const getSmartCompleteContext = async ({
	teamId,
}: {
	teamId: string;
}) => {
	const labelsList = await db
		.select()
		.from(labels)
		.where(eq(labels.teamId, teamId))
		.limit(10);

	const membersList = await getMembers({ teamId });

	const projectsList = await db
		.select()
		.from(projects)
		.where(eq(projects.teamId, teamId))
		.limit(10);

	return {
		labels: labelsList,
		members: membersList,
		projects: projectsList,
	};
};

export const executeMagicTaskActions = async ({
	actions,
	teamId,
	prReviewId,
}: {
	actions: MagicTaskAction[];
	teamId: string;
	prReviewId: string;
}) => {
	if (actions.length === 0) {
		return [];
	}

	// Get all team statuses once
	const teamStatuses = await getStatuses({ pageSize: 100, teamId });
	const executedMagicActions: ((typeof actions)[number] & {
		taskUrl: string;
	})[] = [];

	for (const action of actions) {
		// Find the task in the action
		const [task] = await db
			.select({
				id: tasks.id,
				title: tasks.title,
				statusId: tasks.statusId,
				teamId: tasks.teamId,
				prReviewId: tasks.prReviewId,
				status: {
					id: statuses.id,
					name: statuses.name,
					description: statuses.description,
					order: statuses.order,
					type: statuses.type,
				},
				permalinkId: tasks.permalinkId,
			})
			.from(tasks)
			.innerJoin(statuses, eq(tasks.statusId, statuses.id))
			.where(and(eq(tasks.sequence, action.sequence), eq(tasks.teamId, teamId)))
			.limit(1);

		if (!task) {
			console.warn(`Task with sequence ${action.sequence} not found.`);
			continue;
		}

		// If the task is already in progress, skip
		if (task.status.type === action.status && task.prReviewId === prReviewId) {
			console.info(
				`Task with sequence ${action.sequence} is already in status ${action.status}.`,
			);
			continue;
		}

		let newStatus = teamStatuses.data.find((s) => s.type === action.status);

		if (!newStatus && action.status === "review") {
			// try to find a "in_progress" status as a fallback
			const fallbackStatus = teamStatuses.data.find(
				(s) => s.type === "in_progress",
			);
			newStatus = fallbackStatus;
			console.warn(
				`Status "review" not found for team ${teamId}. Falling back to ${fallbackStatus?.type} status.`,
			);
		}

		// Update task status to in_progress
		await updateTask({
			id: task.id,
			statusId: newStatus?.id,
			teamId: task.teamId,
			prReviewId,
		});

		console.info(
			`Task with sequence ${action.sequence} updated to status ${newStatus?.type}.`,
		);

		executedMagicActions.push({
			...action,
			taskUrl: getTaskPermalink(task.permalinkId),
		});
	}
	return executedMagicActions;
};
