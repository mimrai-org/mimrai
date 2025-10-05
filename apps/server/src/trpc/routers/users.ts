import { getCurrentUser, switchTeam } from "@/db/queries/users";
import { roleScopes } from "@/lib/scopes";
import { switchTeamSchema } from "@/schemas/users";
import { protectedProcedure, router } from "@/trpc/init";

export const usersRouter = router({
	getCurrent: protectedProcedure.query(async ({ ctx }) => {
		const user = await getCurrentUser(ctx.user.id, ctx.user.teamId!);
		return {
			...user,
			team: {
				...user.team,
				scopes: roleScopes[user.team.role],
			},
		};
	}),
	switchTeam: protectedProcedure
		.input(switchTeamSchema)
		.mutation(async ({ ctx, input }) => {
			const user = await switchTeam(ctx.user.id, input.teamId);
			return user;
		}),
});
