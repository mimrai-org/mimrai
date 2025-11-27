import {
	getAvailableTeams,
	getUserById,
	switchTeam,
} from "@mimir/db/queries/users";
import type { Context as HonoContext } from "hono";
import { auth } from "./auth";
import { roleScopes } from "./scopes";

export type CreateContextOptions = {
	context: HonoContext;
};

export async function createContext({ context }: CreateContextOptions) {
	const session = await auth.api.getSession({
		headers: context.req.raw.headers,
	});

	if (!session?.user) {
		return { session: null };
	}

	const user = await getUserById(session?.user.id);
	let currentTeam:
		| Awaited<ReturnType<typeof getAvailableTeams>>[number]
		| undefined;

	if (!user.teamId) {
		// try to set teamId from existing teams
		const teams = await getAvailableTeams(user.id);
		if (teams.length > 0) {
			user.teamId = teams[0].id;
			await switchTeam(user.id, teams[0].id);
			currentTeam = teams[0];
		}
	} else {
		// verify teamId is valid
		const teams = await getAvailableTeams(user.id);
		currentTeam = teams.find((t) => t.id === user.teamId);

		if (!currentTeam) throw new Error("User's current team is not valid");
	}

	const role = currentTeam?.role;
	const scopes = role ? roleScopes[role] : [];

	return {
		session,
		user: {
			...user,
			scopes,
		},
		team: currentTeam ?? null,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
