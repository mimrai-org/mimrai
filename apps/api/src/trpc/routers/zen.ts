import { getZenOrientation, getZenQueue } from "@mimir/db/queries/zen";
import { protectedProcedure, router } from "../init";

export const zenRouter = router({
	queue: protectedProcedure.query(async ({ ctx }) => {
		return getZenQueue({
			userId: ctx.user.id,
			teamId: ctx.user.teamId!,
		});
	}),

	orientation: protectedProcedure.query(async ({ ctx }) => {
		return getZenOrientation({
			userId: ctx.user.id,
			teamId: ctx.user.teamId!,
		});
	}),
});
