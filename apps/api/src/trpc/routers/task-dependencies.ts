import {
	createTaskDependencySchema,
	deleteTaskDependencySchema,
	getAvailableTaskDependenciesSchema,
	getTaskDependenciesSchema,
	updateTaskDependencySchema,
} from "@api/schemas/task-dependencies";
import { protectedProcedure, router } from "@api/trpc/init";
import {
	createTaskDependency,
	deleteTaskDependency,
	getAvailableDependencyTasks,
	getTaskDependencies,
	getTaskDependencyById,
	updateTaskDependency,
} from "@mimir/db/queries/task-dependencies";

export const taskDependenciesRouter = router({
	get: protectedProcedure
		.input(getTaskDependenciesSchema)
		.query(async ({ ctx, input }) => {
			return getTaskDependencies({
				...input,
				teamId: ctx.user.teamId!,
			});
		}),

	create: protectedProcedure
		.input(createTaskDependencySchema)
		.mutation(async ({ ctx, input }) => {
			return createTaskDependency({
				...input,
				teamId: ctx.user.teamId!,
			});
		}),

	update: protectedProcedure
		.input(updateTaskDependencySchema)
		.mutation(async ({ ctx, input }) => {
			return updateTaskDependency({
				...input,
				teamId: ctx.user.teamId!,
			});
		}),

	getById: protectedProcedure
		.input(deleteTaskDependencySchema)
		.query(async ({ ctx, input }) => {
			return getTaskDependencyById({
				...input,
				teamId: ctx.user.teamId!,
			});
		}),

	delete: protectedProcedure
		.input(deleteTaskDependencySchema)
		.mutation(async ({ ctx, input }) => {
			return deleteTaskDependency({
				...input,
				teamId: ctx.user.teamId!,
			});
		}),

	availableTasks: protectedProcedure
		.input(getAvailableTaskDependenciesSchema)
		.query(async ({ ctx, input }) => {
			return getAvailableDependencyTasks({
				...input,
				teamId: ctx.user.teamId!,
			});
		}),
});
