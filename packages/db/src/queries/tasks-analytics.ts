import { add, format } from "date-fns";
import { and, desc, eq, gte, inArray, lte, not, sql } from "drizzle-orm";
import { db } from "../index";
import { activities, columns, tasks, users } from "../schema";

export const getTasksCompletedByDay = async ({
  teamId,
  startDate,
  endDate,
}: {
  teamId: string;
  startDate: Date;
  endDate: Date;
}) => {
  const data = new Map<
    string,
    {
      taskCompletedCount: number;
      checklistItemsCompletedCount: number;
    }
  >();

  // fill in dates with 0 completions
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateKey = format(currentDate, "yyyy-MM-dd 00:00:00+00");
    data.set(dateKey, {
      taskCompletedCount: 0,
      checklistItemsCompletedCount: 0,
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const tasksCompleted = await db
    .select({
      date: sql<Date>`date_trunc('day', ${activities.createdAt})`,
      completedCount: sql<number>`COUNT(*)`,
    })
    .from(activities)
    .where(
      and(
        eq(activities.teamId, teamId),
        eq(activities.type, "task_completed"),
        gte(activities.createdAt, startDate.toISOString()),
        lte(activities.createdAt, endDate.toISOString())
      )
    )
    .groupBy(sql`date_trunc('day', ${activities.createdAt})`)
    .orderBy(sql`date_trunc('day', ${activities.createdAt}) ASC`);

  for (const row of tasksCompleted) {
    const dateKey = format(row.date, "yyyy-MM-dd 00:00:00+00");
    const current = data.get(dateKey);
    data.set(dateKey, {
      ...current!,
      taskCompletedCount: Number(row.completedCount),
    });
  }

  const checklistItemsCompleted = await db
    .select({
      date: sql<Date>`date_trunc('day', ${activities.createdAt})`,
      completedCount: sql<number>`COUNT(*)`,
    })
    .from(activities)
    .where(
      and(
        eq(activities.teamId, teamId),
        eq(activities.type, "checklist_item_completed"),
        gte(activities.createdAt, startDate.toISOString()),
        lte(activities.createdAt, endDate.toISOString())
      )
    )
    .groupBy(sql`date_trunc('day', ${activities.createdAt})`)
    .orderBy(sql`date_trunc('day', ${activities.createdAt}) ASC`);

  for (const row of checklistItemsCompleted) {
    const dateKey = format(row.date, "yyyy-MM-dd 00:00:00+00");
    const current = data.get(dateKey);
    data.set(dateKey, {
      ...current!,
      checklistItemsCompletedCount: Number(row.completedCount),
    });
  }

  return Array.from(data.entries()).map(([date, value]) => ({
    date,
    ...value,
  }));
};

export const getTasksCompletedByMember = async ({
  teamId,
  startDate,
  endDate,
}: {
  teamId: string;
  startDate: Date;
  endDate: Date;
}) => {
  const data = await db
    .select({
      member: {
        id: users.id,
        name: users.name,
        color: users.color,
      },
      completedCount: sql<number>`COUNT(*)`,
    })
    .from(activities)
    .where(
      and(
        eq(activities.teamId, teamId),
        inArray(activities.type, [
          "task_completed",
          "checklist_item_completed",
        ]),
        gte(activities.createdAt, startDate.toISOString()),
        lte(activities.createdAt, endDate.toISOString())
      )
    )
    .innerJoin(users, eq(activities.userId, users.id))
    .groupBy(activities.userId, users.id)
    .orderBy(desc(users.name));

  return data.map((row) => ({
    member: row.member,
    fill: row.member.color,
    completedCount: Number(row.completedCount),
  }));
};

export const getTasksAssignedByMember = async ({
  teamId,
  startDate,
  endDate,
}: {
  teamId: string;
  startDate: Date;
  endDate: Date;
}) => {
  const data = await db
    .select({
      member: {
        id: users.id,
        name: users.name,
        color: users.color,
      },
      assignedCount: sql<number>`COUNT(*)`,
    })
    .from(tasks)
    .where(
      and(
        eq(tasks.teamId, teamId),
        not(inArray(columns.type, ["done", "backlog"]))
      )
    )
    .innerJoin(users, eq(tasks.assigneeId, users.id))
    .innerJoin(columns, eq(tasks.columnId, columns.id))
    .groupBy(tasks.assigneeId, users.id)
    .orderBy(desc(users.name));

  return data.map((row) => ({
    member: row.member,
    fill: row.member.color,
    assignedCount: Number(row.assignedCount),
  }));
};
