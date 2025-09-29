import { eq } from "drizzle-orm";
import { db } from "..";
import { teams } from "../schema/schemas";

export const getTeamById = async (teamId: string) => {
	const [team] = await db
		.select()
		.from(teams)
		.where(eq(teams.id, teamId))
		.limit(1);
	return team;
};
