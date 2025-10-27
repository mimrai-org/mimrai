import { and, eq, type SQL } from "drizzle-orm";
import { db } from "..";
import { teams, userInvites, users, usersOnTeams } from "../schema";
import { switchTeam } from "./users";

export const acceptTeamInvite = async ({
  userInviteId,
  userId,
}: {
  userInviteId: string;
  userId: string;
}) => {
  const [invite] = await db
    .select()
    .from(userInvites)
    .where(eq(userInvites.id, userInviteId))
    .limit(1);

  if (!invite) {
    throw new Error("Invite not found");
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw new Error("User not found");
  }

  if (user.email !== invite.email) {
    throw new Error("This invite is not for your email address");
  }

  const [existing] = await db
    .select()
    .from(usersOnTeams)
    .where(
      and(
        eq(usersOnTeams.userId, userId),
        eq(usersOnTeams.teamId, invite.teamId)
      )
    )
    .limit(1);

  if (existing) {
    throw new Error("User is already a member of this team");
  }

  // add user to team
  await db.insert(usersOnTeams).values({
    userId,
    teamId: invite.teamId,
  });

  // switch user's current team
  await switchTeam(userId, invite.teamId);

  // delete invite
  await db.delete(userInvites).where(eq(userInvites.id, userInviteId));

  return invite;
};

export const getTeamInviteById = async (userInviteId: string) => {
  const [invite] = await db
    .select({
      id: userInvites.id,
      email: userInvites.email,
      teamId: userInvites.teamId,
      team: {
        name: teams.name,
      },
    })
    .from(userInvites)
    .where(eq(userInvites.id, userInviteId))
    .rightJoin(teams, eq(teams.id, userInvites.teamId))
    .limit(1);

  return invite;
};

export const createTeamInvite = async ({
  email,
  teamId,
  invitedBy,
}: {
  email: string;
  teamId: string;
  invitedBy: string;
}) => {
  const [invite] = await db
    .insert(userInvites)
    .values({
      email,
      teamId,
      invitedBy,
    })
    .returning();

  const [newInvite] = await db
    .select({
      id: userInvites.id,
      email: userInvites.email,
      teamId: userInvites.teamId,
      team: {
        name: teams.name,
      },
    })
    .from(userInvites)
    .where(eq(userInvites.id, invite!.id))
    .rightJoin(teams, eq(teams.id, userInvites.teamId))
    .limit(1);

  return newInvite;
};

export const getTeamInvitesByEmail = async ({ email }: { email: string }) => {
  const invites = await db
    .select({
      id: userInvites.id,
      email: userInvites.email,
      createdAt: userInvites.createdAt,
      team: {
        id: teams.id,
        name: teams.name,
      },
    })
    .from(userInvites)
    .where(eq(userInvites.email, email))
    .innerJoin(teams, eq(teams.id, userInvites.teamId))
    .orderBy(userInvites.createdAt);

  return invites;
};

export const getTeamInvites = async ({
  teamId,
  cursor,
  pageSize = 20,
}: {
  teamId?: string;
  cursor?: string;
  pageSize?: number;
}) => {
  const whereClause: SQL[] = [];
  if (teamId) whereClause.push(eq(userInvites.teamId, teamId));

  const query = db
    .select({
      id: userInvites.id,
      email: userInvites.email,
      createdAt: userInvites.createdAt,
    })
    .from(userInvites)
    .where(and(...whereClause))
    .orderBy(userInvites.createdAt);

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

export const deleteTeamInvite = async ({
  inviteId,
  teamId,
}: {
  inviteId: string;
  teamId?: string;
}) => {
  const whereClause: SQL[] = [eq(userInvites.id, inviteId)];
  if (teamId) whereClause.push(eq(userInvites.teamId, teamId));

  const [record] = await db
    .delete(userInvites)
    .where(and(...whereClause))
    .returning();

  return record;
};
