import { roleScopes } from "@api/lib/scopes";
import { switchTeamSchema, updateUserProfileSchema } from "@api/schemas/users";
import { protectedProcedure, router } from "@api/trpc/init";
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
      const user = await switchTeam(ctx.user.id, input.teamId);
      return user;
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
