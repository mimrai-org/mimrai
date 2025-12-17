import {
	createColumnSchema,
	deleteColumnSchema,
	getColumnByIdSchema,
	getColumnsSchema,
	reorderColumnSchema,
	updateColumnSchema,
} from "@api/schemas/columns";
import { protectedProcedure, router } from "@api/trpc/init";
import {
	createStatus,
	deleteStatus,
	getBacklogStatus,
	getStatusById,
	getStatuses,
	reorderStatuses,
	updateStatus,
} from "@mimir/db/queries/statuses";

export const statusesRouter = router({
	get: protectedProcedure
		.input(getColumnsSchema.optional())
		.query(({ ctx, input }) => {
			return getStatuses({
				pageSize: 100,
				...input,
				teamId: ctx.user.teamId!,
			});
		}),
	getBacklogColumn: protectedProcedure.query(({ ctx }) => {
		return getBacklogStatus({
			teamId: ctx.user.teamId!,
		});
	}),
	getById: protectedProcedure
		.input(getColumnByIdSchema)
		.query(({ ctx, input }) => {
			return getStatusById({
				...input,
				teamId: ctx.user.teamId!,
			});
		}),

	create: protectedProcedure
		.input(createColumnSchema)
		.mutation(async ({ ctx, input }) => {
			return createStatus({
				...input,
				teamId: ctx.user.teamId!,
			});
		}),
	update: protectedProcedure
		.input(updateColumnSchema)
		.mutation(async ({ ctx, input }) => {
			return updateStatus({
				...input,
				teamId: ctx.user.teamId!,
			});
		}),
	delete: protectedProcedure
		.input(deleteColumnSchema)
		.mutation(async ({ ctx, input }) => {
			return deleteStatus({
				...input,
				teamId: ctx.user.teamId!,
			});
		}),
	reorder: protectedProcedure
		.input(reorderColumnSchema)
		.mutation(async ({ ctx, input }) => {
			return reorderStatuses({
				items: input.items,
				teamId: ctx.user.teamId!,
			});
		}),
});
