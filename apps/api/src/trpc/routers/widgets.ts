import { getWidgetSchema } from "@api/schemas/widgets";
import { protectedProcedure, router } from "@api/trpc/init";
import {
	getTasksBurnup,
	getTasksByColumn,
	getTasksCompletionRate,
	getTasksSummaryByMember,
	getTasksTodo,
} from "@mimir/db/queries/tasks-analytics";

export const widgetsRouter = router({
	tasksBurnup: protectedProcedure
		.input(getWidgetSchema)
		.query(async ({ ctx, input }) => {
			return getTasksBurnup({
				teamId: ctx.user.teamId!,
				startDate: input.startDate,
				endDate: input.endDate,
			});
		}),

	tasksByColumn: protectedProcedure
		.input(getWidgetSchema)
		.query(async ({ ctx, input }) => {
			return getTasksByColumn({
				teamId: ctx.user.teamId!,
				startDate: input.startDate,
				endDate: input.endDate,
			});
		}),

	tasksCompletionRate: protectedProcedure
		.input(getWidgetSchema)
		.query(async ({ ctx, input }) => {
			return getTasksCompletionRate({
				teamId: ctx.user.teamId!,
				startDate: input.startDate,
				endDate: input.endDate,
			});
		}),

	tasksSummaryByMember: protectedProcedure
		.input(getWidgetSchema)
		.query(async ({ ctx, input }) => {
			return getTasksSummaryByMember({
				teamId: ctx.user.teamId!,
				startDate: input.startDate,
				endDate: input.endDate,
			});
		}),

	tasksTodo: protectedProcedure.query(async ({ ctx, input }) => {
		return getTasksTodo({
			teamId: ctx.user.teamId!,
		});
	}),
});
