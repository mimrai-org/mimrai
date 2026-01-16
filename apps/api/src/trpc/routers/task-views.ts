import {
	createTaskViewSchema,
	deleteTaskViewSchema,
	getDefaultTaskViewSchema,
	getTaskViewByIdSchema,
	getTaskViewsSchema,
	setDefaultTaskViewSchema,
	updateTaskViewSchema,
} from "@api/schemas/task-views";
import { protectedProcedure, router } from "@api/trpc/init";
import {
	createTaskView,
	deleteTaskView,
	getDefaultTaskView,
	getTaskViewById,
	getTaskViews,
	setDefaultTaskView,
	updateTaskView,
} from "@mimir/db/queries/task-views";

export const taskViewsRouter = router({
	get: protectedProcedure
		.input(getTaskViewsSchema.optional())
		.query(async ({ ctx, input }) => {
			return getTaskViews({
				...input,
				teamId: ctx.user.teamId!,
			});
		}),

	getById: protectedProcedure
		.input(getTaskViewByIdSchema)
		.query(async ({ ctx, input }) => {
			return getTaskViewById({
				id: input.id,
				teamId: ctx.user.teamId!,
			});
		}),

	getDefault: protectedProcedure
		.input(getDefaultTaskViewSchema.optional())
		.query(async ({ ctx, input }) => {
			return getDefaultTaskView({
				teamId: ctx.user.teamId!,
				projectId: input?.projectId,
			});
		}),

	create: protectedProcedure
		.input(createTaskViewSchema)
		.mutation(async ({ ctx, input }) => {
			return createTaskView({
				...input,
				teamId: ctx.user.teamId!,
				userId: ctx.user.id,
			});
		}),

	update: protectedProcedure
		.input(updateTaskViewSchema)
		.mutation(async ({ ctx, input }) => {
			return updateTaskView({
				...input,
				teamId: ctx.user.teamId!,
			});
		}),

	setDefault: protectedProcedure
		.input(setDefaultTaskViewSchema)
		.mutation(async ({ ctx, input }) => {
			return setDefaultTaskView({
				id: input.id,
				teamId: ctx.user.teamId!,
			});
		}),

	delete: protectedProcedure
		.input(deleteTaskViewSchema)
		.mutation(async ({ ctx, input }) => {
			return deleteTaskView({
				id: input.id,
				teamId: ctx.user.teamId!,
			});
		}),
});
