import {
	createTask,
	deleteTask,
	getTasks,
	updateTask,
} from "@/db/queries/tasks";
import { protectedProcedure, router } from "@/lib/trpc";
import {
	createTaskSchema,
	deleteTaskSchema,
	getTasksSchema,
	updateTaskSchema,
} from "@/schemas/tasks";

export const tasksRouter = router({
	get: protectedProcedure
		.input(getTasksSchema.optional())
		.query(({ ctx, input }) => {
			return getTasks({
				pageSize: 100,
				...input,
			});
		}),
	create: protectedProcedure
		.input(createTaskSchema)
		.mutation(async ({ ctx, input }) => {
			return createTask({
				...input,
			});
		}),
	update: protectedProcedure
		.input(updateTaskSchema)
		.mutation(async ({ ctx, input }) => {
			return updateTask({
				...input,
			});
		}),
	delete: protectedProcedure
		.input(deleteTaskSchema)
		.mutation(async ({ ctx, input }) => {
			return deleteTask({
				...input,
			});
		}),
});
