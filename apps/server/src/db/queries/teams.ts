import { eq } from "drizzle-orm";
import { db } from "..";
import { teams, users, usersOnTeams } from "../schema/schemas";

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
	description,
	userId,
}: {
	name: string;
	description?: string;
	userId: string;
}) => {
	const [team] = await db
		.insert(teams)
		.values({
			name,
			description,
		})
		.returning();

	await db.insert(usersOnTeams).values({ teamId: team.id, userId });

	const userTeams = await db
		.select({ id: usersOnTeams.teamId })
		.from(usersOnTeams)
		.where(eq(usersOnTeams.userId, userId))
		.limit(2);

	if (userTeams.length === 1) {
		// This is the first team, set it as the user's current team
		await db.update(users).set({ teamId: team.id }).where(eq(users.id, userId));
	}

	return team;
};

export const updateTeam = async ({
	name,
	description,
	id,
}: {
	name?: string;
	description?: string;
	id: string;
}) => {
	const [team] = await db
		.update(teams)
		.set({
			name,
			description,
		})
		.where(eq(teams.id, id))
		.returning();

	return team;
};

export const getMembers = async ({ teamId }: { teamId: string }) => {
	const members = await db
		.select({
			id: users.id,
			email: users.email,
			name: users.name,
			image: users.image,
		})
		.from(usersOnTeams)
		.rightJoin(users, eq(users.id, usersOnTeams.userId))
		.where(eq(usersOnTeams.teamId, teamId))
		.limit(20);
	return members;
};
