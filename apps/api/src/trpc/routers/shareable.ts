import {
	deleteShareableByResourceSchema,
	getShareableByIdSchema,
	getShareableByResourceIdSchema,
	getShareableResourceSchema,
	upsertShareableSchema,
} from "@api/schemas/shareable";
import {
	deleteShareableByResource,
	getShareableById,
	getShareableByResourceId,
	getShareableResource,
	upsertShareable,
} from "@mimir/db/queries/shareable";
import { protectedProcedure, publicProcedure, router } from "../init";

export const shareableRouter = router({
	upsert: protectedProcedure
		.input(upsertShareableSchema)
		.mutation(async ({ input, ctx }) => {
			return upsertShareable({
				...input,
				teamId: ctx.user.teamId,
			});
		}),

	delete: protectedProcedure
		.input(deleteShareableByResourceSchema)
		.mutation(async ({ input, ctx }) => {
			return deleteShareableByResource({
				...input,
				teamId: ctx.user.teamId,
			});
		}),

	getById: protectedProcedure
		.input(getShareableByIdSchema)
		.query(async ({ input, ctx }) => {
			return getShareableById({
				...input,
				userEmail: ctx.user.email,
			});
		}),

	getByResourceId: protectedProcedure
		.input(getShareableByResourceIdSchema)
		.query(async ({ input, ctx }) => {
			return getShareableByResourceId({
				...input,
				teamId: ctx.user.teamId,
			});
		}),

	getResource: publicProcedure
		.input(getShareableResourceSchema)
		.query(async ({ input, ctx }) => {
			return getShareableResource({
				...input,
				userEmail: ctx.user?.email,
			});
		}),
});
