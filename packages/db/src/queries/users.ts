import type { GetUsersInput } from "@api/schemas/users";
import { and, eq, ilike, type SQL } from "drizzle-orm";
import { db } from "..";
import { teams, users, usersOnTeams } from "../schema";

export const getUserById = async (userId: string) => {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return user;
};

export const getCurrentUser = async (userId: string, teamId?: string) => {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      locale: users.locale,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (teamId) {
    const [membership] = await db
      .select({
        id: teams.id,
        name: teams.name,
        role: usersOnTeams.role,
        locale: teams.locale,
        timezone: teams.timezone,
      })
      .from(usersOnTeams)
      .innerJoin(teams, eq(teams.id, usersOnTeams.teamId))
      .where(
        and(eq(usersOnTeams.userId, userId), eq(usersOnTeams.teamId, teamId))
      )
      .limit(1);

    return {
      ...user,
      team: membership,
    };
  }
  return {
    ...user,
    team: null,
  };
};

export const getUsers = async ({
  pageSize,
  cursor,
  ...input
}: GetUsersInput) => {
  const whereConditions: SQL[] = [];

  input.search && whereConditions.push(ilike(users.name, `%${input.search}%`));
  input.teamId && whereConditions.push(eq(usersOnTeams.teamId, input.teamId));

  const query = db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(users)
    .where(and(...whereConditions))
    .leftJoin(usersOnTeams, eq(users.id, usersOnTeams.userId));

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

export const switchTeam = async (userId: string, teamId: string) => {
  const [newTeam] = await db
    .select({
      id: teams.id,
      name: teams.name,
    })
    .from(usersOnTeams)
    .rightJoin(teams, eq(teams.id, usersOnTeams.teamId))
    .where(
      and(eq(usersOnTeams.userId, userId), eq(usersOnTeams.teamId, teamId))
    )
    .limit(1);

  if (!newTeam) {
    throw new Error("User is not part of the team");
  }

  const [user] = await db
    .update(users)
    .set({ teamId: teamId })
    .where(eq(users.id, userId))
    .returning();

  return {
    ...user,
    team: newTeam,
  };
};

export const getAvailableTeams = async (userId: string) => {
  const teamsList = await db
    .select({
      id: teams.id,
      name: teams.name,
      role: usersOnTeams.role,
    })
    .from(usersOnTeams)
    .innerJoin(teams, eq(teams.id, usersOnTeams.teamId))
    .where(eq(usersOnTeams.userId, userId))
    .orderBy(teams.id)
    .limit(50);
  return teamsList;
};

export const getSystemUser = async () => {
  const [systemUser] = await db
    .select()
    .from(users)
    .where(eq(users.isSystemUser, true))
    .limit(1);

  if (!systemUser) {
    const [newSystemUser] = await db
      .insert(users)
      .values({
        name: "System",
        email: "system@start-mimir.app",
        isSystemUser: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: true,
        id: crypto.randomUUID(),
        color: "hsl(0, 0%, 20%)",
      })
      .returning();
    return newSystemUser;
  }

  return systemUser;
};

export const updateUser = async ({
  userId,
  name,
  locale,
}: {
  userId: string;
  name?: string;
  locale?: string;
}) => {
  const [record] = await db
    .update(users)
    .set({
      name: name,
      locale: locale,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  return record;
};
