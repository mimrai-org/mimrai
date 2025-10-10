import { generateSystemPrompt } from "@api/ai/generate-system-prompt";
import { getUserContext } from "@api/ai/utils/get-user-context";
import {
	commentTaskSchema,
	createTaskSchema,
	deleteTaskSchema,
	getTasksSchema,
	smartCompleteResponseSchema,
	smartCompleteSchema,
	updateTaskSchema,
} from "@api/schemas/tasks";
import { protectedProcedure, router } from "@api/trpc/init";
import { getColumns } from "@db/queries/columns";
import { getLabels } from "@db/queries/labels";
import { getMembers } from "@db/queries/teams";
import {
	createTask,
	createTaskComment,
	deleteTask,
	getTaskById,
	getTasks,
	updateTask,
} from "@mimir/db/queries/tasks";
import { generateObject } from "ai";

export const tasksRouter = router({
	get: protectedProcedure
		.input(getTasksSchema.optional())
		.query(({ ctx, input }) => {
			return getTasks({
				pageSize: 100,
				...input,
				teamId: ctx.user.teamId!,
			});
		}),
	create: protectedProcedure
		.input(createTaskSchema)
		.mutation(async ({ ctx, input }) => {
			return createTask({
				...input,
				userId: ctx.user.id,
				teamId: ctx.user.teamId!,
			});
		}),
	update: protectedProcedure
		.input(updateTaskSchema.omit({ teamId: true }))
		.mutation(async ({ ctx, input }) => {
			return updateTask({
				...input,
				userId: ctx.user.id,
				teamId: ctx.user.teamId!,
			});
		}),
	delete: protectedProcedure
		.input(deleteTaskSchema.omit({ teamId: true }))
		.mutation(async ({ ctx, input }) => {
			return deleteTask({
				...input,
				teamId: ctx.user.teamId!,
			});
		}),
	getById: protectedProcedure
		.input(updateTaskSchema.pick({ id: true }))
		.query(async ({ ctx, input }) => {
			return getTaskById(input.id, ctx.user.teamId!);
		}),

	comment: protectedProcedure
		.input(commentTaskSchema)
		.mutation(async ({ ctx, input }) => {
			return createTaskComment({
				taskId: input.id,
				comment: input.comment,
				userId: ctx.user.id,
				teamId: ctx.user.teamId!,
			});
		}),

	smartComplete: protectedProcedure
		.input(smartCompleteSchema)
		.mutation(async ({ input, ctx }) => {
			const userContext = await getUserContext({
				userId: ctx.user.id,
				teamId: ctx.user.teamId!,
			});
			const columns = (
				await getColumns({
					teamId: ctx.user.teamId!,
					pageSize: 20,
				})
			).data.map((column) => ({
				id: column.id,
				name: column.name,
				description: column.description,
			}));
			const labels = (
				await getLabels({
					teamId: ctx.user.teamId!,
				})
			).map((label) => ({
				id: label.id,
				name: label.name,
				description: label.description,
			}));
			const members = (
				await getMembers({
					teamId: ctx.user.teamId!,
				})
			).map((member) => ({
				id: member.id,
				name: member.name,
				description: member.description,
			}));

			const response = await generateObject({
				system: generateSystemPrompt(userContext),
				model: "openai/gpt-4o",
				schema: smartCompleteResponseSchema,
				prompt: `Generate a task using the following context, you not need to use tools to complete this task.
					Columns: ${JSON.stringify(columns)}
					Labels: ${JSON.stringify(labels)}
					Members: ${JSON.stringify(members)}

					Task prompt: ${input.prompt}
				`,
			});

			return response.object;
		}),
});
