import {
	createColumn,
	deleteColumn,
	getColumns,
	updateColumn,
} from "@/db/queries/columns";
import { protectedProcedure, router } from "@/lib/trpc";
import {
	createColumnSchema,
	deleteColumnSchema,
	getColumnsSchema,
	updateColumnSchema,
} from "@/schemas/columns";

export const columnsRouter = router({
	get: protectedProcedure
		.input(getColumnsSchema.optional())
		.query(({ ctx, input }) => {
			return getColumns({
				pageSize: 100,
				...input,
			});
		}),
	create: protectedProcedure
		.input(createColumnSchema)
		.mutation(async ({ ctx, input }) => {
			return createColumn({
				...input,
			});
		}),
	update: protectedProcedure
		.input(updateColumnSchema)
		.mutation(async ({ ctx, input }) => {
			return updateColumn({
				...input,
			});
		}),
	delete: protectedProcedure
		.input(deleteColumnSchema)
		.mutation(async ({ ctx, input }) => {
			return deleteColumn({
				...input,
			});
		}),
});
