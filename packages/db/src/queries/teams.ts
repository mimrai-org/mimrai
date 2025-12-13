import { generateTeamPrefix, generateTeamSlug } from "@mimir/utils/teams";
import { and, eq, ilike, isNull, ne, not, or, type SQL } from "drizzle-orm";
import { db } from "..";
import { type plansEnum, teams, users, usersOnTeams } from "../schema";

export const checkSlugExists = async (slug: string) => {
	const [team] = await db
		.select()
		.from(teams)
		.where(eq(teams.slug, slug))
		.limit(1);

	return !!team;
};

export const generateUniqueTeamSlug = async (name: string) => {
	let prefix = generateTeamSlug(name);
	let attempt = 0;
	while (await checkSlugExists(prefix)) {
		attempt++;
		prefix = `${generateTeamSlug(name)}${attempt}`;
	}
	return prefix;
};

export const getTeamById = async (teamId: string) => {
	const [team] = await db
		.select()
		.from(teams)
		.where(eq(teams.id, teamId))
		.limit(1);

	return team;
};

export const createTeam = async ({
	name,
	slug,
	email,
	description,
	userId,
	timezone,
	locale,
}: {
	name: string;
	slug?: string;
	email: string;
	description?: string;
	userId: string;
	timezone?: string;
	locale?: string;
}) => {
	if (!slug) {
		slug = await generateUniqueTeamSlug(name);
	}
	const prefix = generateTeamPrefix(name);

	const [team] = await db
		.insert(teams)
		.values({
			name,
			slug,
			prefix,
			email,
			description,
			timezone,
			locale,
		})
		.returning();

	if (!team) {
		throw new Error("Failed to create team");
	}

	await db
		.insert(usersOnTeams)
		.values({ teamId: team.id, userId, role: "owner" });

	const userTeams = await db
		.select({ id: usersOnTeams.teamId })
		.from(usersOnTeams)
		.where(eq(usersOnTeams.userId, userId))
		.limit(2);

	if (userTeams.length === 1) {
		// This is the first team, set it as the user's current team
		await db.update(users).set({ teamId: team.id }).where(eq(users.id, userId));
	}

	// Create default labels
	// const defaultLabels = await createDefaultLabels(team.id);

	// // Create default columns
	// const defaultColumns = await createDefaultStatuses(team.id);

	// // Create default tasks
	// await createDefaultTasks({
	// 	statusId: defaultColumns[0]!.id,
	// 	labelId: defaultLabels[0]!.id,
	// 	assigneeId: userId,
	// 	teamId: team.id,
	// });

	return team;
};

export const linkCustomerToTeam = async ({
	teamId,
	customerId,
}: {
	teamId: string;
	customerId: string;
}) => {
	const [team] = await db
		.update(teams)
		.set({ customerId })
		.where(eq(teams.id, teamId))
		.returning();

	if (!team) {
		throw new Error("Failed to link customer to team");
	}

	return team;
};

export const updateTeam = async ({
	name,
	description,
	email,
	locale,
	timezone,
	plan,
	subscriptionId,
	id,
}: {
	name?: string;
	description?: string;
	email?: string;
	locale?: string;
	timezone?: string;
	subscriptionId?: string;
	plan?: (typeof plansEnum.enumValues)[number] | null;
	id: string;
}) => {
	const [team] = await db
		.update(teams)
		.set({
			name,
			email,
			description,
			locale,
			timezone,
			subscriptionId,
			plan,
		})
		.where(eq(teams.id, id))
		.returning();

	return team;
};

export const getMembers = async ({
	teamId,
	search,
	role,
	isMentionable,
	includeSystemUsers,
}: {
	teamId: string;
	search?: string;
	role?: "owner" | "member";
	isMentionable?: boolean;
	includeSystemUsers?: boolean;
}) => {
	const whereClause: SQL[] = [
		eq(usersOnTeams.teamId, teamId),
		not(isNull(usersOnTeams.userId)),
	];
	const systemUsersWhereClause: SQL[] = [eq(users.isSystemUser, true)];

	search && whereClause.push(ilike(users.name, `%${search}%`));
	role && whereClause.push(eq(usersOnTeams.role, role));
	isMentionable && whereClause.push(eq(users.isMentionable, true));
	isMentionable && systemUsersWhereClause.push(eq(users.isMentionable, true));

	const members = await db
		.select({
			id: users.id,
			email: users.email,
			name: users.name,
			image: users.image,
			color: users.color,
			description: usersOnTeams.description,
			role: usersOnTeams.role,
		})
		.from(users)
		.leftJoin(usersOnTeams, eq(users.id, usersOnTeams.userId))
		.where(
			includeSystemUsers
				? or(and(...whereClause), and(...systemUsersWhereClause))
				: and(...whereClause),
		)
		.limit(20);
	return members;
};

export const leaveTeam = async (userId: string, teamId: string) => {
	const [existingMembership] = await db
		.select()
		.from(usersOnTeams)
		.where(
			and(eq(usersOnTeams.userId, userId), eq(usersOnTeams.teamId, teamId)),
		)
		.limit(1);

	if (!existingMembership) {
		throw new Error("User is not part of the team");
	}

	if (existingMembership.role === "owner") {
		// Check if there are other owners
		const owners = await db
			.select()
			.from(usersOnTeams)
			.where(
				and(
					eq(usersOnTeams.teamId, teamId),
					eq(usersOnTeams.role, "owner"),
					// Exclude the current user
					ne(usersOnTeams.userId, userId),
				),
			)
			.limit(1);

		if (owners.length === 0) {
			throw new Error(
				"Cannot leave team as you are the only owner. Please transfer ownership or delete the team.",
			);
		}
	}

	await db
		.delete(usersOnTeams)
		.where(
			and(eq(usersOnTeams.userId, userId), eq(usersOnTeams.teamId, teamId)),
		);

	// If the user's current team is the one they left, unset it
	const [user] = await db
		.select()
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);

	if (user?.teamId === teamId) {
		await db.update(users).set({ teamId: null }).where(eq(users.id, userId));
	}

	return existingMembership;
};

export const changeOwner = async ({
	userId,
	teamId,
}: {
	userId: string;
	teamId: string;
}) => {
	const [existingOwnerMembership] = await db
		.select()
		.from(usersOnTeams)
		.where(
			and(eq(usersOnTeams.userId, userId), eq(usersOnTeams.teamId, teamId)),
		)
		.limit(1);

	if (!existingOwnerMembership) {
		throw new Error("User is not part of the team");
	}

	// Downgrade existing owners to members
	await db
		.update(usersOnTeams)
		.set({ role: "member" })
		.where(
			and(
				eq(usersOnTeams.teamId, teamId),
				eq(usersOnTeams.role, "owner"),
				// Exclude the new owner
				ne(usersOnTeams.userId, userId),
			),
		);

	const [newOwnerMembership] = await db
		.update(usersOnTeams)
		.set({ role: "owner" })
		.where(
			and(eq(usersOnTeams.userId, userId), eq(usersOnTeams.teamId, teamId)),
		)
		.returning();

	return newOwnerMembership;
};

export const updateMember = async ({
	userId,
	teamId,
	description,
}: {
	userId: string;
	teamId: string;
	description?: string;
}) => {
	const [existingMembership] = await db
		.select()
		.from(usersOnTeams)
		.where(
			and(eq(usersOnTeams.userId, userId), eq(usersOnTeams.teamId, teamId)),
		)
		.limit(1);

	if (!existingMembership) {
		throw new Error("User is not part of the team");
	}

	await db
		.update(usersOnTeams)
		.set({ description })
		.where(
			and(eq(usersOnTeams.userId, userId), eq(usersOnTeams.teamId, teamId)),
		);

	const [updatedMembership] = await db
		.select({
			id: users.id,
			email: users.email,
			name: users.name,
			image: users.image,
			color: users.color,
			role: usersOnTeams.role,
			description: usersOnTeams.description,
		})
		.from(usersOnTeams)
		.innerJoin(users, eq(users.id, usersOnTeams.userId))
		.where(
			and(eq(usersOnTeams.userId, userId), eq(usersOnTeams.teamId, teamId)),
		)
		.limit(1);

	return updatedMembership;
};

export const getMemberById = async ({
	userId,
	teamId,
}: {
	userId: string;
	teamId: string;
}) => {
	const [member] = await db
		.select({
			id: users.id,
			email: users.email,
			name: users.name,
			image: users.image,
			color: users.color,
			role: usersOnTeams.role,
			description: usersOnTeams.description,
		})
		.from(usersOnTeams)
		.innerJoin(users, eq(users.id, usersOnTeams.userId))
		.where(
			and(eq(usersOnTeams.teamId, teamId), eq(usersOnTeams.userId, userId)),
		)
		.limit(1);
	return member;
};

export const updateTeamPlan = async ({
	customerId,
	plan,
	subscriptionId,
	canceledAt,
}: {
	customerId: string;
	subscriptionId?: string;
	plan?: (typeof plansEnum.enumValues)[number] | null;
	canceledAt?: Date | null;
}) => {
	const [team] = await db
		.update(teams)
		.set({ plan, canceledAt, subscriptionId })
		.where(eq(teams.customerId, customerId))
		.returning();

	return team;
};

export const getMemberByEmail = async ({
	email,
	teamId,
}: {
	email: string;
	teamId: string;
}) => {
	const [member] = await db
		.select({
			id: users.id,
			email: users.email,
			name: users.name,
			image: users.image,
			color: users.color,
			role: usersOnTeams.role,
			description: usersOnTeams.description,
		})
		.from(usersOnTeams)
		.innerJoin(users, eq(users.id, usersOnTeams.userId))
		.where(and(eq(usersOnTeams.teamId, teamId), eq(users.email, email)))
		.limit(1);
	return member;
};

export const deleteTeam = async (teamId: string) => {
	const [team] = await db.delete(teams).where(eq(teams.id, teamId)).returning();
	return team;
};
