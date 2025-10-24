import { and, asc, eq, is, type SQL, sql } from "drizzle-orm";
import { db } from "../index";
import { checklistItems, users } from "../schema";

export const createChecklistItem = async ({
  taskId,
  description,
  assigneeId,
  teamId,
}: {
  taskId?: string;
  teamId: string;
  description: string;
  assigneeId?: string;
}) => {
  const [nextOrder] = await db
    .select({
      maxOrder: sql<number>`COALESCE(MAX("order"), 0) + 1`,
    })
    .from(checklistItems)
    .where(eq(checklistItems.teamId, teamId))
    .limit(1);

  const [item] = await db
    .insert(checklistItems)
    .values({
      taskId,
      teamId,
      description,
      assigneeId,
      order: nextOrder?.maxOrder ?? 1,
    })
    .returning();

  return item;
};

export const getChecklistItems = async ({
  taskId,
  teamId,
  search,
}: {
  taskId?: string;
  teamId?: string;
  search?: string;
}) => {
  const whereClause: SQL[] = [];
  if (taskId) {
    whereClause.push(eq(checklistItems.taskId, taskId));
  }
  if (teamId) {
    whereClause.push(eq(checklistItems.teamId, teamId));
  }

  if (search) {
    whereClause.push(sql`${checklistItems.description} ILIKE %${search}%`);
  }

  const data = await db
    .select({
      id: checklistItems.id,
      taskId: checklistItems.taskId,
      description: checklistItems.description,
      assigneeId: checklistItems.assigneeId,
      order: checklistItems.order,
      createdAt: checklistItems.createdAt,
      updatedAt: checklistItems.updatedAt,
      isCompleted: checklistItems.isCompleted,
      assignee: {
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
        color: users.color,
      },
    })
    .from(checklistItems)
    .where(and(...whereClause))
    .leftJoin(users, eq(checklistItems.assigneeId, users.id))
    .orderBy(asc(checklistItems.order))
    .limit(100);

  return data;
};

export const updateChecklistItem = async ({
  id,
  description,
  assigneeId,
  isCompleted,
  teamId,
}: {
  id: string;
  description?: string;
  assigneeId?: string;
  isCompleted?: boolean;
  teamId?: string;
}) => {
  const whereClause: SQL[] = [eq(checklistItems.id, id)];
  if (teamId) {
    whereClause.push(eq(checklistItems.teamId, teamId));
  }
  const [item] = await db
    .update(checklistItems)
    .set({
      description,
      assigneeId,
      isCompleted,
    })
    .where(and(...whereClause))
    .returning();

  return item;
};

export const deleteChecklistItem = async ({
  id,
  teamId,
}: {
  id: string;
  teamId?: string;
}) => {
  const whereClause: SQL[] = [eq(checklistItems.id, id)];
  if (teamId) {
    whereClause.push(eq(checklistItems.teamId, teamId));
  }
  await db.delete(checklistItems).where(and(...whereClause));
};
