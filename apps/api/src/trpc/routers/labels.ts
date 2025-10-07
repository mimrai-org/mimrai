import {
	createTaskLabelSchema,
	deleteTaskLabelSchema,
	getTaskLabelByIdSchema,
	getTaskLabelsSchema,
	updateTaskLabelSchema,
} from "@api/schemas/task-label";
import { protectedProcedure, router } from "@api/trpc/init";
import {
	createLabel,
	deleteLabel,
	getLabelById,
	getLabels,
	updateLabel,
} from "@mimir/db/queries/labels";

export const labelsRouter = router({
	get: protectedProcedure
		.input(getTaskLabelsSchema)
		.query(async ({ ctx, input }) => {
			return getLabels({
				...input,
				teamId: ctx.user.teamId!,
			});
		}),

	create: protectedProcedure
		.input(createTaskLabelSchema)
		.mutation(async ({ ctx, input }) => {
			return await createLabel({
				...input,
				teamId: ctx.user.teamId!,
			});
		}),

	update: protectedProcedure
		.input(updateTaskLabelSchema)
		.mutation(async ({ ctx, input }) => {
			return updateLabel({
				...input,
				teamId: ctx.user.teamId!,
			});
		}),

	getById: protectedProcedure
		.input(getTaskLabelByIdSchema)
		.query(async ({ ctx, input }) => {
			return getLabelById({
				...input,
				teamId: ctx.user.teamId!,
			});
		}),

	delete: protectedProcedure
		.input(deleteTaskLabelSchema)
		.mutation(async ({ ctx, input }) => {
			return deleteLabel({
				...input,
				teamId: ctx.user.teamId!,
			});
		}),
});
