import { initTRPC, TRPCError } from "@trpc/server";
import type { Scope } from "@/lib/scopes";
import type { Context } from "../lib/context";

type Meta = {
	/**
	 * @default true
	 */
	team?: boolean;

	scopes?: Scope[];
};
export const t = initTRPC.context<Context>().meta<Meta>().create({
	// transformer: superjson,
});

export const router = t.router;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure
	.meta({ team: true })
	.use(({ ctx, next, meta }) => {
		if (!ctx.session) {
			throw new TRPCError({
				code: "UNAUTHORIZED",
				message: "Authentication required",
				cause: "No session",
			});
		}

		if (!ctx.user.teamId && meta?.team) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "User does not belong to a team",
				cause: "No team",
			});
		}

		if (meta?.scopes) {
			const hasRequiredScopes = meta.scopes.every((scope) =>
				ctx.user.scopes.includes(scope),
			);
			if (!hasRequiredScopes) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Insufficient permissions",
					cause: "Insufficient permissions",
				});
			}
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
