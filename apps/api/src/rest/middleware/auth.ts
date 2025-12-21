import { auth } from "@api/lib/auth";
import { getUserById } from "@mimir/db/queries/users";
import type { Session } from "better-auth";
import type { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";

export const withAuth: MiddlewareHandler = async (c, next) => {
	const authSession = await auth.api.getSession({
		headers: c.req.raw.headers,
	});

	// If we have a valid session, get the user and set in context
	if (authSession) {
		// Get user from database to get team info
		const user = await getUserById(authSession.user.id);

		if (!user) {
			throw new HTTPException(401, { message: "User not found" });
		}

		const session: Session = {
			...authSession.session,
		};

		c.set("session", session);
		c.set("teamId", user.teamId);
		c.set("userId", user.id);
		// Grant all scopes for authenticated users via Supabase
		// c.set("scopes", expandScopes(["apis.all"]));

		await next();
		return;
	}

	throw new HTTPException(401, { message: "Invalid or expired token" });
};
