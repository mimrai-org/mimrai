import type { DeleteTaskInput } from "@api/schemas/tasks";
import { subDays } from "date-fns";
import {
	and,
	arrayContains,
	asc,
	desc,
	eq,
	gte,
	inArray,
	isNotNull,
	isNull,
	notInArray,
	or,
	type SQL,
	sql,
} from "drizzle-orm";
import { nanoid } from "nanoid";
import { buildSearchQuery } from "src/utils/search-query";
import { db } from "..";
import {
	checklistItems,
	columns,
	labels,
	labelsOnTasks,
	projects,
	pullRequestPlan,
	tasks,
	users,
	usersOnTeams,
} from "../schema";
import { unionArray } from "../utils/array";
import {
	createActivity,
	createTaskUpdateActivity,
	deleteActivity,
} from "./activities";
import { upsertTaskEmbedding } from "./tasks-embeddings";

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
	columnId?: string[];
	labels?: string[];
	teamId?: string;
	projectId?: string[];
	nProjectId?: string[];
	search?: string;
	recurring?: boolean;
	view?: "board" | "backlog" | "workstation";
}) => {
	const whereClause: (SQL | undefined)[] = [];

	const assigneesConcat = `${input.assigneeId?.join(",")}`;
	input.assigneeId &&
		input.assigneeId.length > 0 &&
		whereClause.push(
			or(
				inArray(tasks.assigneeId, input.assigneeId),
				// filter by any checklist item assignee
				sql`${tasks.id} IN (SELECT ${checklistItems.taskId} FROM ${checklistItems} WHERE ${checklistItems.assigneeId} IN (${assigneesConcat}) AND ${checklistItems.isCompleted} = false)`,
			),
		);
	input.columnId && whereClause.push(inArray(tasks.columnId, input.columnId));
	input.teamId && whereClause.push(eq(tasks.teamId, input.teamId));
	input.labels &&
		input.labels.length > 0 &&
		whereClause.push(inArray(labelsOnTasks.labelId, input.labels));
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

	if (input.search) {
		if (!Number.isNaN(Number.parseInt(input.search, 10))) {
			whereClause.push(eq(tasks.sequence, Number.parseInt(input.search, 10)));
		} else {
			const query = buildSearchQuery(input.search);
			whereClause.push(
				sql`(to_tsquery('english', unaccent(${query})) @@ ${tasks.fts})`,
			);
		}
	}

	// exlude done tasks with more than 3 days
	if (input.view === "board" || input.view === "workstation") {
		whereClause.push(
			or(
				inArray(columns.type, ["in_progress", "to_do"]),
				and(
					eq(columns.type, "done"),
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

	const query = db
		.select({
			id: tasks.id,
			title: tasks.title,
			description: tasks.description,
			assigneeId: tasks.assigneeId,
			sequence: tasks.sequence,
			projectId: tasks.projectId,
			permalinkId: tasks.permalinkId,
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
			columnId: tasks.columnId,
			repositoryName: tasks.repositoryName,
			branchName: tasks.branchName,
			order: tasks.order,
			priority: tasks.priority,
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
			pullRequestPlan: {
				id: pullRequestPlan.id,
				prUrl: pullRequestPlan.prUrl,
				prTitle: pullRequestPlan.prTitle,
				status: pullRequestPlan.status,
			},
			recurring: tasks.recurring,
			recurringJobId: tasks.recurringJobId,
			recurringNextDate: tasks.recurringNextDate,
			column: {
				id: columns.id,
				name: columns.name,
				description: columns.description,
				order: columns.order,
				type: columns.type,
			},
			labels: labelsSubquery.labels,
		})
		.from(tasks)
		.where(and(...whereClause))
		.innerJoin(columns, eq(tasks.columnId, columns.id))
		.leftJoin(labelsSubquery, eq(labelsSubquery.taskId, tasks.id))
		.leftJoin(users, eq(tasks.assigneeId, users.id))
		.leftJoin(checklistSubquery, eq(checklistSubquery.taskId, tasks.id))
		.leftJoin(projects, eq(tasks.projectId, projects.id))
		.leftJoin(
			pullRequestPlan,
			and(
				eq(tasks.id, pullRequestPlan.taskId),
				inArray(pullRequestPlan.status, ["pending", "completed", "error"]),
			),
		);

	if (input.view === "board") {
		query.orderBy(
			asc(
				sql`CASE ${tasks.priority} WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 END`,
			),
			desc(tasks.dueDate),
			tasks.order,
		);
	} else if (input.view === "workstation") {
		query.orderBy(
			asc(
				sql`CASE ${tasks.priority} WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 END`,
			),
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

export const createTask = async ({
	labels,
	userId,
	...input
}: {
	labels?: string[];
	title: string;
	description?: string;
	assigneeId?: string;
	columnId: string;
	teamId: string;
	order?: number;
	priority?: "low" | "medium" | "high" | "urgent";
	repositoryName?: string;
	branchName?: string;
	dueDate?: string;
	attachments?: string[];
	mentions?: string[];
	projectId?: string;
	userId?: string;
	recurring?: {
		startDate?: string;
		frequency: "daily" | "weekly" | "monthly" | "yearly";
		interval: number;
	};
}) => {
	const { sequence, order } = await getNextTaskSequence(input.teamId);
	const permalinkId = await generateTaskPermalinkId();
	const [task] = await db
		.insert(tasks)
		.values({
			...input,
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
		groupId: task.id,
	});

	await upsertTaskEmbedding({
		task,
		teamId: task.teamId,
	});

	return task;
};

export const deleteTask = async (input: DeleteTaskInput) => {
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
	columnId?: string;
	teamId?: string;
	order?: number;
	priority?: "low" | "medium" | "high" | "urgent";
	repositoryName?: string;
	branchName?: string;
	dueDate?: string;
	attachments?: string[];
	mentions?: string[];
	userId?: string;
	projectId?: string;
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

	await upsertTaskEmbedding({
		task,
		teamId: task.teamId,
	});

	createTaskUpdateActivity({
		oldTask,
		newTask: task,
		teamId: task.teamId,
		userId,
	});

	return task;
};

export const getTaskByPermalinkId = async (
	permalinkId: string,
	userId?: string,
) => {
	console.log({
		permalinkId,
		userId,
	});
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

	const [task] = await db
		.select({
			id: tasks.id,
			title: tasks.title,
			description: tasks.description,
			assigneeId: tasks.assigneeId,
			sequence: tasks.sequence,
			projectId: tasks.projectId,
			assignee: {
				id: users.id,
				name: users.name,
				email: users.email,
				image: users.image,
				color: users.color,
			},
			columnId: tasks.columnId,
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
			pullRequestPlan: {
				id: pullRequestPlan.id,
				prUrl: pullRequestPlan.prUrl,
				prTitle: pullRequestPlan.prTitle,
				status: pullRequestPlan.status,
			},
			recurring: tasks.recurring,
			recurringJobId: tasks.recurringJobId,
			recurringNextDate: tasks.recurringNextDate,
			column: {
				id: columns.id,
				name: columns.name,
				description: columns.description,
				order: columns.order,
				type: columns.type,
			},
			labels: labelsSubquery.labels,
		})
		.from(tasks)
		.where(and(...whereClause))
		.innerJoin(columns, eq(tasks.columnId, columns.id))
		.innerJoin(usersOnTeams, eq(usersOnTeams.teamId, tasks.teamId))
		.leftJoin(labelsSubquery, eq(labelsSubquery.taskId, tasks.id))
		.leftJoin(users, eq(tasks.assigneeId, users.id))
		.leftJoin(
			pullRequestPlan,
			and(
				eq(tasks.id, pullRequestPlan.taskId),
				inArray(pullRequestPlan.status, ["pending", "completed", "error"]),
			),
		)
		.limit(1);

	return task;
};

export const createDefaultTasks = async ({
	columnId,
	labelId,
	assigneeId,
	teamId,
}: {
	columnId: string;
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
				columnId,
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
}: {
	taskId: string;
	userId: string;
	teamId?: string;
	replyTo?: string;
	comment: string;
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
		metadata: { comment, title: task.title, subscribers: newTask.subscribers },
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
}: {
	taskId: string;
	teamId: string;
	userId: string;
}) => {
	const task = await getTaskById(taskId, teamId);
	if (!task) throw new Error("Task not found");

	const newTask = await createTask({
		title: task.title,
		description: task.description!,
		assigneeId: task.assigneeId!,
		columnId: task.columnId,
		order: task.order,
		priority: task.priority,
		labels: task.labels?.map((label) => label.id),
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
