import {
	bulkUpdateActivitiesSchema,
	deleteActivitySchema,
	getActivitiesCountSchema,
	getActivitiesSchema,
} from "@api/schemas/activities";
import { protectedProcedure, router } from "@api/trpc/init";
import {
	bulkUpdateActivity,
	deleteActivity,
	getActivities,
	getActivitiesCount,
	hasNewActivities,
} from "@mimir/db/queries/activities";
import { subscribeToEvents } from "@mimir/realtime";

export const activitiesRouter = router({
	get: protectedProcedure
		.input(getActivitiesSchema)
		.query(async ({ ctx, input }) => {
			return getActivities({
				...input,
				priority: input.priority as [number, number] | undefined,
				teamId: ctx.user.teamId!,
				...(input.onlyForUser ? { userId: ctx.user.id } : {}),
			});
		}),

	delete: protectedProcedure
		.input(deleteActivitySchema)
		.mutation(async ({ ctx, input }) => {
			return deleteActivity({
				...input,
				teamId: ctx.user.teamId!,
			});
		}),

	bulkUpdate: protectedProcedure
		.input(bulkUpdateActivitiesSchema)
		.mutation(async ({ ctx, input }) => {
			return bulkUpdateActivity({
				...input,
				teamId: ctx.user.teamId!,
				userId: ctx.user.id,
			});
		}),

	count: protectedProcedure
		.input(getActivitiesCountSchema)
		.query(async ({ ctx, input }) => {
			return getActivitiesCount({
				...input,
				teamId: ctx.user.teamId!,
				userId: ctx.user.id,
			});
		}),

	hasNew: protectedProcedure.query(async ({ ctx }) => {
		return hasNewActivities({
			teamId: ctx.user.teamId!,
			userId: ctx.user.id,
		});
	}),

	onCreated: protectedProcedure.subscription(async function* (opts) {
		for await (const comment of subscribeToEvents(["activities.created"], {
			signal: opts.signal,
		})) {
			console.log("Activity created event received in subscription:", comment);
			yield comment;
		}
	}),
});
