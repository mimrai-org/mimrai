import { getActivitiesSchema } from "@api/schemas/activities";
import { protectedProcedure, router } from "@api/trpc/init";
import { getActivities } from "@mimir/db/queries/activities";

export const activitiesRouter = router({
	get: protectedProcedure
		.input(getActivitiesSchema)
		.query(async ({ ctx, input }) => {
			return getActivities({
				...input,
				teamId: ctx.user.teamId!,
			});
		}),
});
