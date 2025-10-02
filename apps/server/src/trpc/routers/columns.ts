import {
	createColumn,
	deleteColumn,
	getColumns,
	updateColumn,
} from "@/db/queries/columns";
import {
	createColumnSchema,
	deleteColumnSchema,
	getColumnsSchema,
	updateColumnSchema,
} from "@/schemas/columns";
import { protectedProcedure, router } from "@/trpc/init";

export const columnsRouter = router({
	get: protectedProcedure
		.input(getColumnsSchema.optional())
		.query(({ ctx, input }) => {
			return getColumns({
				pageSize: 100,
				...input,
				teamId: ctx.user.teamId!,
			});
		}),
	create: protectedProcedure
		.input(createColumnSchema)
		.mutation(async ({ ctx, input }) => {
			return createColumn({
				...input,
				teamId: ctx.user.teamId!,
			});
		}),
	update: protectedProcedure
		.input(updateColumnSchema)
		.mutation(async ({ ctx, input }) => {
			return updateColumn({
				...input,
				teamId: ctx.user.teamId!,
			});
		}),
	delete: protectedProcedure
		.input(deleteColumnSchema)
		.mutation(async ({ ctx, input }) => {
			return deleteColumn({
				...input,
				teamId: ctx.user.teamId!,
			});
		}),
});
