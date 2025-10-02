import {
	createTeam,
	getMembers,
	getTeamById,
	updateTeam,
} from "@/db/queries/teams";
import { getAvailableTeams } from "@/db/queries/users";
import { createTeamSchema, updateTeamSchema } from "@/schemas/teams";
import { protectedProcedure, router } from "@/trpc/init";

export const teamsRouter = router({
	getAvailable: protectedProcedure.query(async ({ ctx }) => {
		const teams = await getAvailableTeams(ctx.user.id);
		return teams;
	}),

	create: protectedProcedure
		.input(createTeamSchema)
		.meta({
			requiresTeam: false,
		})
		.mutation(async ({ ctx, input }) => {
			const team = await createTeam({ ...input, userId: ctx.user.id });
			return team;
		}),

	getCurrent: protectedProcedure.query(async ({ ctx }) => {
		const team = await getTeamById(ctx.user.teamId!);
		return team;
	}),

	update: protectedProcedure
		.input(updateTeamSchema)
		.mutation(async ({ ctx, input }) => {
			return updateTeam({
				...input,
				id: ctx.user.teamId!,
			});
		}),

	getMembers: protectedProcedure.query(async ({ ctx }) => {
		const members = await getMembers({
			teamId: ctx.user.teamId!,
		});
		return members;
	}),
});
