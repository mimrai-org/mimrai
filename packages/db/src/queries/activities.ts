import { sendNotificationJob } from "@jobs/jobs/notifications/send-notification-job";
import {
  and,
  desc,
  eq,
  gte,
  type InferSelectModel,
  inArray,
  type SQL,
  sql,
} from "drizzle-orm";
import { db } from "..";
import {
  activities,
  type activityTypeEnum,
  type tasks,
  users,
} from "../schema";
import { getColumnById } from "./columns";
import {
  notificationChannels,
  shouldSendNotification,
} from "./notification-settings";
import { getMemberById } from "./teams";
import { getSystemUser, getUserById } from "./users";

export type CreateActivityInput = {
  userId?: string | null;
  teamId: string;
  groupId?: string;
  type: (typeof activityTypeEnum.enumValues)[number];
  metadata?: Record<string, any>;
};

export const createActivity = async (input: CreateActivityInput) => {
  let userId = input.userId;

  // If userId is not set, get system user id
  if (!userId) {
    userId = (await getSystemUser())!.id;
  }

  let metadataChanges = input.metadata?.changes;
  if (input.groupId && userId) {
    // Check if the last activity is the same type and from the same user
    const [lastActivity] = await db
      .select()
      .from(activities)
      .where(
        and(
          eq(activities.groupId, input.groupId),
          eq(activities.userId, userId),
          eq(activities.type, input.type),
          gte(activities.createdAt, sql`now() - interval '5 minutes'`)
        )
      )
      .orderBy(desc(activities.createdAt))
      .limit(1);

    // Delete the last activity if it's the same type and from the same user
    if (lastActivity?.metadata?.changes && metadataChanges) {
      // Merge the changes
      metadataChanges = {
        ...lastActivity.metadata.changes,
        ...metadataChanges,
      };
      await db.delete(activities).where(eq(activities.id, lastActivity.id));
    }
  }

  const [result] = await db
    .insert(activities)
    .values({
      userId: userId,
      teamId: input.teamId,
      type: input.type,
      groupId: input.groupId,
      metadata: {
        ...input.metadata,
        changes: metadataChanges,
      },
    })
    .returning();

  if (input.userId && result) {
    for (const channel of notificationChannels) {
      const shouldSend = await shouldSendNotification(
        userId,
        input.teamId,
        input.type,
        channel
      );

      if (shouldSend) {
        await sendNotificationJob.trigger({
          activityId: result.id,
          channel,
        });
      }
    }
  }

  return result;
};

export const createTaskUpdateActivity = async ({
  oldTask,
  newTask,
  userId,
  teamId,
}: {
  oldTask: InferSelectModel<typeof tasks>;
  newTask: InferSelectModel<typeof tasks>;
  userId?: string;
  teamId: string;
}) => {
  const changeKeys = [
    "title",
    "description",
    "columnId",
    "dueDate",
    "assigneeId",
  ] as const;
  const changes: Partial<
    Record<
      (typeof changeKeys)[number],
      { value: string | null; display?: string | null; oldValue: string | null }
    >
  > = {};
  if (oldTask.title !== newTask.title)
    changes.title = { value: newTask.title, oldValue: oldTask.title };
  if (oldTask.description !== newTask.description)
    changes.description = {
      value: newTask.description,
      oldValue: oldTask.description,
    };
  if (oldTask.columnId !== newTask.columnId) {
    const newColumn = await getColumnById({ id: newTask.columnId, teamId });
    changes.columnId = {
      value: newTask.columnId,
      display: newColumn.name,
      oldValue: oldTask.columnId,
    };
  }
  if (oldTask.dueDate !== newTask.dueDate)
    changes.dueDate = { value: newTask.dueDate, oldValue: oldTask.dueDate };
  if (oldTask.assigneeId !== newTask.assigneeId && newTask.assigneeId) {
    const newAssignee = await getMemberById({
      userId: newTask.assigneeId,
      teamId,
    });
    changes.assigneeId = {
      value: newTask.assigneeId,
      display: newAssignee?.name || null,
      oldValue: oldTask.assigneeId,
    };
  }

  if (changes.assigneeId) {
    await createActivity({
      userId,
      teamId,
      groupId: newTask.id,
      type: "task_assigned",
      metadata: {
        title: newTask.title,
        assigneeName: changes.assigneeId.display,
        subscribers: newTask.subscribers,
      },
    });
    delete changes.assigneeId;
  }

  if (changes.columnId) {
    await createActivity({
      userId,
      teamId,
      groupId: newTask.id,
      type: "task_column_changed",
      metadata: {
        fromColumnId: changes.columnId.oldValue,
        toColumnId: changes.columnId.value,
        toColumnName: changes.columnId.display,
        title: newTask.title,
        subscribers: newTask.subscribers,
      },
    });
    delete changes.columnId;
  }

  if (Object.keys(changes).length === 0) {
    return null;
  }

  const activity = await createActivity({
    userId,
    teamId,
    groupId: newTask.id,
    type: "task_updated",
    metadata: {
      changes,
      title: newTask.title,
      subscribers: newTask.subscribers,
    },
  });

  return activity;
};

export const getActivities = async ({
  teamId,
  type,
  cursor,
  groupId,
  pageSize,
}: {
  teamId?: string;
  type?: (typeof activityTypeEnum.enumValues)[number][];
  groupId?: string;
  cursor?: string;
  pageSize?: number;
}) => {
  const whereClause: SQL[] = [];

  teamId && whereClause.push(eq(activities.teamId, teamId));
  type && whereClause.push(inArray(activities.type, type));
  groupId && whereClause.push(eq(activities.groupId, groupId));

  // Convert cursor to offset
  const offset = cursor ? Number.parseInt(cursor, 10) : 0;

  const data = await db
    .select({
      id: activities.id,
      type: activities.type,
      createdAt: activities.createdAt,
      metadata: activities.metadata,
      userId: activities.userId,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
        color: users.color,
      },
      groupId: activities.groupId,
      teamId: activities.teamId,
    })
    .from(activities)
    .where(and(...whereClause))
    .leftJoin(users, eq(activities.userId, users.id))
    .orderBy(desc(activities.createdAt))
    .limit(pageSize ?? 20)
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

export const getActivityById = async (id: string) => {
  const [activity] = await db
    .select()
    .from(activities)
    .where(eq(activities.id, id))
    .limit(1);

  return activity;
};
