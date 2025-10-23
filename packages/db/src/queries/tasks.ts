import type { DeleteTaskInput } from "@api/schemas/tasks";
import { subDays } from "date-fns";
import {
  and,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import { buildSearchQuery } from "src/utils/search-query";
import { db } from "..";
import {
  columns,
  labels,
  labelsOnTasks,
  pullRequestPlan,
  tasks,
  users,
} from "../schema";
import { unionArray } from "../utils/array";
import { createActivity, createTaskUpdateActivity } from "./activities";
import { upsertTaskEmbedding } from "./tasks-embeddings";

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
  search?: string;
  view?: "board" | "backlog";
}) => {
  const whereClause: (SQL | undefined)[] = [];

  input.assigneeId &&
    input.assigneeId.length > 0 &&
    whereClause.push(inArray(tasks.assigneeId, input.assigneeId));
  input.columnId && whereClause.push(inArray(tasks.columnId, input.columnId));
  input.teamId && whereClause.push(eq(tasks.teamId, input.teamId));
  input.labels &&
    input.labels.length > 0 &&
    whereClause.push(inArray(labelsOnTasks.labelId, input.labels));

  if (input.search) {
    const query = buildSearchQuery(input.search);
    whereClause.push(
      sql`(to_tsquery('english', unaccent(${query})) @@ ${tasks.fts})`
    );
  }

  // exlude done tasks with more than 3 days
  if (input.view === "board") {
    whereClause.push(
      or(
        eq(columns.type, "normal"),
        and(
          eq(columns.type, "done"),
          gte(tasks.updatedAt, subDays(new Date(), 3).toISOString())
        )
      )
    );
  }

  const query = db
    .select({
      id: tasks.id,
      title: tasks.title,
      description: tasks.description,
      assigneeId: tasks.assigneeId,
      sequence: tasks.sequence,
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
      dueDate: tasks.dueDate,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
      teamId: tasks.teamId,
      attachments: tasks.attachments,
      pullRequestPlan: {
        id: pullRequestPlan.id,
        prUrl: pullRequestPlan.prUrl,
        prTitle: pullRequestPlan.prTitle,
        status: pullRequestPlan.status,
      },
      column: {
        id: columns.id,
        name: columns.name,
        description: columns.description,
        order: columns.order,
        type: columns.type,
      },
      labels: sql<
        {
          id: string;
          name: string;
          color: string;
        }[]
      >`COALESCE(json_agg(DISTINCT jsonb_build_object('id', ${labels.id}, 'name', ${labels.name}, 'color', ${labels.color}) ) FILTER (WHERE ${labels.id} IS NOT NULL), '[]'::json)`.as(
        "labels"
      ),
    })
    .from(tasks)
    .where(and(...whereClause))
    .innerJoin(columns, eq(tasks.columnId, columns.id))
    .leftJoin(labelsOnTasks, eq(labelsOnTasks.taskId, tasks.id))
    .leftJoin(labels, eq(labels.id, labelsOnTasks.labelId))
    .leftJoin(users, eq(tasks.assigneeId, users.id))
    .leftJoin(
      pullRequestPlan,
      and(
        eq(tasks.id, pullRequestPlan.taskId),
        inArray(pullRequestPlan.status, ["pending", "completed", "error"])
      )
    )
    .groupBy(tasks.id, users.id, columns.id, pullRequestPlan.id);

  if (input.view === "board") {
    query.orderBy(tasks.order);
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
  priority?: "low" | "medium" | "high";
  dueDate?: string;
  attachments?: string[];
  userId?: string;
}) => {
  const { sequence, order } = await getNextTaskSequence(input.teamId);
  const [task] = await db
    .insert(tasks)
    .values({
      ...input,
      sequence,
      order,
      subscribers: unionArray([userId, input.assigneeId]),
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

  await createActivity({
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
  assigneeId?: string;
  columnId?: string;
  teamId?: string;
  order?: number;
  priority?: "low" | "medium" | "high";
  dueDate?: string;
  attachments?: string[];
  userId?: string;
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
      subscribers: unionArray(oldTask.subscribers, [input.assigneeId]),
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

export const getTaskById = async (id: string, teamId?: string) => {
  const whereClause: SQL[] = [eq(tasks.id, id)];

  if (teamId) {
    whereClause.push(eq(tasks.teamId, teamId));
  }

  const [task] = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      description: tasks.description,
      assigneeId: tasks.assigneeId,
      sequence: tasks.sequence,
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
      dueDate: tasks.dueDate,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
      teamId: tasks.teamId,
      attachments: tasks.attachments,
      pullRequestPlan: {
        id: pullRequestPlan.id,
        prUrl: pullRequestPlan.prUrl,
        prTitle: pullRequestPlan.prTitle,
        status: pullRequestPlan.status,
      },
      column: {
        id: columns.id,
        name: columns.name,
        description: columns.description,
        order: columns.order,
        type: columns.type,
      },
      labels: sql<
        {
          id: string;
          name: string;
          color: string;
        }[]
      >`COALESCE(json_agg(DISTINCT jsonb_build_object('id', ${labels.id}, 'name', ${labels.name}, 'color', ${labels.color}) ) FILTER (WHERE ${labels.id} IS NOT NULL), '[]'::json)`.as(
        "labels"
      ),
    })
    .from(tasks)
    .where(and(...whereClause))
    .innerJoin(columns, eq(tasks.columnId, columns.id))
    .leftJoin(labelsOnTasks, eq(labelsOnTasks.taskId, tasks.id))
    .leftJoin(labels, eq(labels.id, labelsOnTasks.labelId))
    .leftJoin(users, eq(tasks.assigneeId, users.id))
    .leftJoin(
      pullRequestPlan,
      and(
        eq(tasks.id, pullRequestPlan.taskId),
        inArray(pullRequestPlan.status, ["pending", "completed", "error"])
      )
    )
    .groupBy(tasks.id, users.id, columns.id, pullRequestPlan.id)
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

  const data = await db
    .insert(tasks)
    .values(
      defaultTasks.map((task, index) => ({
        ...task,
        columnId,
        teamId,
        assigneeId,
        order: index,
      }))
    )
    .returning();

  for (const task of data) {
    await db.insert(labelsOnTasks).values({ taskId: task.id, labelId });
  }

  return data;
};

export const createTaskComment = async ({
  taskId,
  userId,
  teamId,
  comment,
}: {
  taskId: string;
  userId: string;
  teamId?: string;
  comment: string;
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
      subscribers: unionArray(task.subscribers, [userId]),
    })
    .where(and(...whereClause));

  createActivity({
    userId,
    teamId: task.teamId,
    type: "task_comment",
    groupId: task.id,
    metadata: { comment, title: task.title, subscribers: task.subscribers },
  });

  return task;
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
