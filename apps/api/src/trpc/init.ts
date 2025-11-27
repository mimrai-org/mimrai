import type { Scope } from "@api/lib/scopes";
import type { PlanSlug } from "@mimir/utils/plans";
import { initTRPC, TRPCError } from "@trpc/server";
import type { Context } from "../lib/context";

type Meta = {
	/**
	 * require user to belong to a team
	 * @default true
	 */
	team?: boolean;

	/**
	 * require scopes for this procedure
	 */
	scopes?: Scope[];

	/**
	 * require plan for this procedure
	 */
	plans?: PlanSlug[];
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

		if (meta?.plans && meta.plans.length > 0) {
			// check if user's team plan is in the required plans
			if (!ctx.team) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "User's team information is missing",
					cause: "No team",
				});
			}

			if (!meta.plans.includes(ctx.team.plan)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Insufficient plan level",
					cause: "Insufficient plan level",
				});
			}
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
			console.error((result as any).error);
		}
		return result;
	});
