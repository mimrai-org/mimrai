import { create } from "domain";
import { and, eq, type SQL } from "drizzle-orm";
import { addMeterUsage } from "@/lib/meters";
import { polarClient } from "@/lib/payments";
import { db } from "..";
import { teams, userInvites, users, usersOnTeams } from "../schema/schemas";
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

	// add user to team
	await db.insert(usersOnTeams).values({
		userId,
		teamId: invite.teamId,
	});

	await addMeterUsage(invite.teamId, "users", 1);

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
		.where(eq(userInvites.id, invite.id))
		.rightJoin(teams, eq(teams.id, userInvites.teamId))
		.limit(1);

	return newInvite;
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
