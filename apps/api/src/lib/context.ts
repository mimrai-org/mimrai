import { teamCache } from "@mimir/cache/teams-cache";
import { userCache } from "@mimir/cache/users-cache";
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
		// @ts-expect-error
		return { session: null };
	}

	let user: Awaited<ReturnType<typeof getUserById>> = await userCache.get(
		session.user.id,
	);
	if (!user) {
		user = await getUserById(session.user.id);
		userCache.set(session.user.id, user);
	}

	let currentTeam:
		| Awaited<ReturnType<typeof getAvailableTeams>>[number]
		| undefined;

	if (!user.teamId || !user.teamSlug) {
		// try to set teamId from existing teams
		const teams = await getAvailableTeams(user.id);
		if (teams.length > 0) {
			user.teamId = teams[0].id;
			user.teamSlug = teams[0].slug;
			await switchTeam(user.id, {
				teamId: teams[0].id,
			});
			currentTeam = teams[0];
		}
	} else {
		const cachedTeam = await teamCache.get(`${user.id}:${user.teamId}`);
		if (cachedTeam) {
			currentTeam = cachedTeam;
		} else {
			// verify teamId is valid
			const teams = await getAvailableTeams(user.id);
			currentTeam = teams.find((t) => t.id === user.teamId);

			if (!currentTeam) throw new Error("User's current team is not valid");
			teamCache.set(`${user.id}:${user.teamId}`, currentTeam);
		}
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
