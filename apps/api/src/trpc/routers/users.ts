import { roleScopes } from "@api/lib/scopes";
import { switchTeamSchema, updateUserProfileSchema } from "@api/schemas/users";
import { protectedProcedure, router } from "@api/trpc/init";
import { teamCache } from "@mimir/cache/teams-cache";
import { userCache } from "@mimir/cache/users-cache";
import {
	getCurrentUser,
	switchTeam,
	updateUser,
} from "@mimir/db/queries/users";

export const usersRouter = router({
	getCurrent: protectedProcedure
		.meta({ team: false })
		.query(async ({ ctx }) => {
			const user = await getCurrentUser(ctx.user.id, ctx.user.teamId!);
			if (user.team) {
				// Attach scopes to team
				return {
					...user,
					team: {
						...user.team,
						scopes: roleScopes[user.team.role],
					},
				};
			}

			return {
				...user,
				team: null,
			};
		}),
	switchTeam: protectedProcedure
		.input(switchTeamSchema)
		.mutation(async ({ ctx, input }) => {
			// check if we really need to switch
			if ("slug" in input && ctx.user.teamSlug === input.slug) {
				// no switch needed
				return {
					user: ctx.user,
					slug: input.slug,
				};
			}

			if ("teamId" in input && ctx.user.teamId === input.teamId) {
				// no switch needed
				return {
					user: ctx.user,
					slug: ctx.user.teamSlug,
				};
			}

			const user = await switchTeam(ctx.user.id, input);
			await userCache.delete(ctx.user.id);
			await teamCache.delete(`${ctx.user.id}:${user.teamId}`);
			return {
				user,
				slug: user.team.slug,
			};
		}),

	updateProfile: protectedProcedure
		.input(updateUserProfileSchema)
		.mutation(async ({ ctx, input }) => {
			return await updateUser({
				...input,
				userId: ctx.user.id,
			});
		}),
});
