import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { Context } from "../lib/context";

type Meta = {
	requiresTeam?: boolean;
};
export const t = initTRPC.context<Context>().meta<Meta>().create({
	// transformer: superjson,
});

export const router = t.router;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure
	.meta({ requiresTeam: true })
	.use(({ ctx, next, meta }) => {
		if (!ctx.session) {
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message: "Authentication required",
				cause: "No session",
			});
		}

		if (!ctx.user.teamId && meta?.requiresTeam) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "User does not belong to a team",
				cause: "No team",
			});
		}

		return next({
			ctx: {
				...ctx,
				session: ctx.session,
			},
		});
	})
	.use(async ({ next }) => {
		const result = await next();
		if (!result.ok) {
			console.error(result.error);
		}
		return result;
	});
