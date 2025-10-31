import { getWidgetSchema } from "@api/schemas/widgets";
import { protectedProcedure, router } from "@api/trpc/init";
import {
  getTasksAssignedByMember,
  getTasksCompletedByDay,
  getTasksCompletedByMember,
} from "@mimir/db/queries/tasks-analytics";

export const widgetsRouter = router({
  tasksCompletedByDay: protectedProcedure
    .input(getWidgetSchema)
    .query(async ({ ctx, input }) => {
      return getTasksCompletedByDay({
        teamId: ctx.user.teamId!,
        startDate: input.startDate,
        endDate: input.endDate,
      });
    }),

  tasksCompletedByMember: protectedProcedure
    .input(getWidgetSchema)
    .query(async ({ ctx, input }) => {
      return getTasksCompletedByMember({
        teamId: ctx.user.teamId!,
        startDate: input.startDate,
        endDate: input.endDate,
      });
    }),

  tasksAssignedByMember: protectedProcedure
    .input(getWidgetSchema)
    .query(async ({ ctx, input }) => {
      return getTasksAssignedByMember({
        teamId: ctx.user.teamId!,
        startDate: input.startDate,
        endDate: input.endDate,
      });
    }),
});
