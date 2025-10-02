import { HTTPException } from "hono/http-exception";
import { getTeamById } from "@/db/queries/teams";
import { getUserById } from "@/db/queries/users";
import { type ChatUserContext, chatCache } from "../chat-cache";

interface GetUserContextParams {
	userId: string;
	teamId: string;
	country?: string;
	city?: string;
	timezone?: string;
}

/**
 * Gets user context for chat operations, with caching support
 * Fetches team and user data if not cached, then caches the result
 */
export async function getUserContext({
	userId,
	teamId,
	country,
	city,
	timezone,
}: GetUserContextParams): Promise<ChatUserContext> {
	// Try to get cached context first
	const cached = await chatCache.getUserContext(userId, teamId);
	if (cached) {
		return cached;
	}

	// If not cached, fetch team and user data in parallel
	const [team, user] = await Promise.all([
		getTeamById(teamId),
		getUserById(userId),
	]);

	if (!team || !user) {
		throw new HTTPException(404, {
			message: "User or team not found",
		});
	}

	const context: ChatUserContext = {
		userId,
		teamId,
		teamName: team.name,
		teamDescription: team.description,
		fullName: user.name,
		locale: user.locale ?? "en-US",
		dateFormat: user.dateFormat,
		country,
		city,
		timezone,
	};

	// Cache for future requests (non-blocking)
	chatCache.setUserContext(userId, teamId, context).catch((err) => {
		console.warn({
			msg: "Failed to cache user context",
			userId,
			teamId,
			error: err.message,
		});
	});

	return context;
}
