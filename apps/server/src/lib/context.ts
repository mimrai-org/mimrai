import type { Context as HonoContext } from "hono";
import { getUserById } from "@/db/queries/users";
import { auth } from "./auth";

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

	return {
		session,
		user,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
