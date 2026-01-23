import {
	createActivityReactionSchema,
	deleteActivityReactionSchema,
	getActivityReactionsSchema,
	toggleActivityReactionSchema,
} from "@api/schemas/activities";
import { protectedProcedure, router } from "@api/trpc/init";
import {
	createActivityReaction,
	deleteActivityReaction,
	getActivityReactions,
	getActivityReactionsSummary,
	toggleActivityReaction,
} from "@mimir/db/queries/activity-reactions";

export const activitiesReactionsRouter = router({
	get: protectedProcedure
		.input(getActivityReactionsSchema)
		.query(async ({ input }) => {
			return getActivityReactions(input.activityId);
		}),

	getSummary: protectedProcedure
		.input(getActivityReactionsSchema)
		.query(async ({ input }) => {
			return getActivityReactionsSummary(input.activityId);
		}),

	create: protectedProcedure
		.input(createActivityReactionSchema)
		.mutation(async ({ ctx, input }) => {
			return createActivityReaction({
				...input,
				userId: ctx.user.id,
			});
		}),

	delete: protectedProcedure
		.input(deleteActivityReactionSchema)
		.mutation(async ({ ctx, input }) => {
			return deleteActivityReaction({
				...input,
				userId: ctx.user.id,
			});
		}),

	toggle: protectedProcedure
		.input(toggleActivityReactionSchema)
		.mutation(async ({ ctx, input }) => {
			return toggleActivityReaction({
				...input,
				userId: ctx.user.id,
			});
		}),
});
