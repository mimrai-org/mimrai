import { getTeamById } from "@/db/queries/teams";
import { getUserById, switchTeam } from "@/db/queries/users";
import { switchTeamSchema } from "@/schemas/users";
import { protectedProcedure, router } from "@/trpc/init";

export const usersRouter = router({
	getCurrent: protectedProcedure.query(async ({ ctx }) => {
		const user = await getUserById(ctx.user.id);
		const currentTeam = await getTeamById(ctx.user.teamId!);
		return {
			...user,
			team: {
				id: currentTeam.id,
				name: currentTeam.name,
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
