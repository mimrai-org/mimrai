import {
	getZenModeSettings,
	getZenOrientation,
	getZenQueue,
	updateLastZenModeAt,
} from "@mimir/db/queries/zen";
import z from "zod";
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

	updateLastActivity: protectedProcedure
		.input(
			z.object({
				date: z.coerce.date(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return updateLastZenModeAt({
				userId: ctx.user.id,
				teamId: ctx.user.teamId!,
				date: input.date,
			});
		}),

	getSettings: protectedProcedure.query(async ({ ctx }) => {
		return getZenModeSettings({
			userId: ctx.user.id,
			teamId: ctx.user.teamId!,
		});
	}),
});
