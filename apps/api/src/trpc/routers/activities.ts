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
import { getChannelName, subscribeToEvents } from "@mimir/realtime";
import z from "zod";

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

	onCreated: protectedProcedure
		.input(
			z.object({
				groupId: z.string().optional(),
			}),
		)
		.subscription(async function* ({ input, signal, ctx }) {
			for await (const activity of subscribeToEvents({
				events: ["activities.created"],
				channel: getChannelName(ctx.user.teamId, input.groupId),
				signal: signal,
			})) {
				if (input.groupId && !input.groupId.includes(activity.groupId)) {
					continue;
				}

				const activitiesList = await getActivities({
					ids: [activity.id],
				});
				const [newActivity] = activitiesList.data;

				yield newActivity;
			}
		}),
});
