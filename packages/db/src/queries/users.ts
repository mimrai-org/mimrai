import { and, eq, ilike, type SQL } from "drizzle-orm";
import { db } from "..";
import { agents, teams, users, usersOnTeams } from "../schema";
import { createAgent } from "./agents";

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
			image: users.image,
			color: users.color,
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
				slug: teams.slug,
				prefix: teams.prefix,
				locale: teams.locale,
				timezone: teams.timezone,
			})
			.from(usersOnTeams)
			.innerJoin(teams, eq(teams.id, usersOnTeams.teamId))
			.where(
				and(eq(usersOnTeams.userId, userId), eq(usersOnTeams.teamId, teamId)),
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
}: {
	pageSize: number;
	cursor?: string;
	search?: string;
	teamId?: string;
}) => {
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

export const switchTeam = async (
	userId: string,
	{
		slug,
		teamId,
	}: {
		slug?: string;
		teamId?: string;
	},
) => {
	const whereClause: SQL[] = [eq(usersOnTeams.userId, userId)];
	if (slug) {
		whereClause.push(eq(teams.slug, slug));
	}
	if (teamId) {
		whereClause.push(eq(teams.id, teamId));
	}

	if (!slug && !teamId) {
		throw new Error("Either slug or teamId must be provided");
	}

	const [newTeam] = await db
		.select({
			id: teams.id,
			name: teams.name,
			slug: teams.slug,
		})
		.from(usersOnTeams)
		.innerJoin(teams, eq(teams.id, usersOnTeams.teamId))
		.where(and(...whereClause))
		.limit(1);

	if (!newTeam) {
		throw new Error("User is not part of the team");
	}

	const [user] = await db
		.update(users)
		.set({ teamId: newTeam.id, teamSlug: newTeam.slug, updatedAt: new Date() })
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
			slug: teams.slug,
			plan: teams.plan,
			customerId: teams.customerId,
			role: usersOnTeams.role,
		})
		.from(usersOnTeams)
		.innerJoin(teams, eq(teams.id, usersOnTeams.teamId))
		.where(eq(usersOnTeams.userId, userId))
		.orderBy(teams.id)
		.limit(50);
	return teamsList;
};

export const getMimirUser = async ({ teamId }: { teamId: string }) => {
	const email = `${teamId}-main@mimrai.com`;
	const [systemUser] = await db
		.select()
		.from(agents)
		.where(
			and(
				eq(users.isSystemUser, true),
				eq(users.email, email),
				eq(agents.teamId, teamId),
			),
		)
		.innerJoin(users, eq(users.id, agents.userId))
		.limit(1);

	if (!systemUser) {
		const agent = await createAgent({
			teamId,
			name: "Mimir",
			isActive: true,
			soul: "You are Mimir, a helpful and concise assistant.",
		});

		const [user] = await db
			.select()
			.from(users)
			.where(eq(users.id, agent.userId))
			.limit(1);
		return user;
	}

	return systemUser.user;
};

export const updateUser = async ({
	userId,
	name,
	image,
	locale,
}: {
	userId: string;
	image?: string | null;
	name?: string;
	locale?: string;
}) => {
	const [record] = await db
		.update(users)
		.set({
			name: name,
			locale: locale,
			image: image,
			updatedAt: new Date(),
		})
		.where(eq(users.id, userId))
		.returning();

	return record;
};

export const getMentionableSystemUsers = async () => {
	const systemUsers = await db
		.select()
		.from(users)
		.where(and(eq(users.isSystemUser, true), eq(users.isMentionable, true)));
	return systemUsers;
};
