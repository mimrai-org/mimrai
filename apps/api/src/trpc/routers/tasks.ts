import { generateSystemPrompt } from "@api/ai/generate-system-prompt";
import { getUserContext } from "@api/ai/utils/get-user-context";
import {
	commentTaskSchema,
	createTaskSchema,
	deleteTaskSchema,
	getDuplicatedTasksSchema,
	getTasksSchema,
	smartCompleteResponseSchema,
	smartCompleteSchema,
	updateTaskSchema,
} from "@api/schemas/tasks";
import { protectedProcedure, router } from "@api/trpc/init";
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
import { getDuplicateTaskEmbedding } from "@mimir/db/queries/tasks-embeddings";
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

	getDuplicates: protectedProcedure
		.input(getDuplicatedTasksSchema)
		.query(async ({ ctx, input }) => {
			return getDuplicateTaskEmbedding({
				task: input,
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
				system: `You are an AI assistant that helps users manage their tasks effectively and efficiently.
				You can create tasks based on user prompts, ensuring they are well-defined and actionable.
				
				TASK CREATION GUIDELINES:
				- Focus on usability and clarity
				- Do not include unnecessary details
				- Ensure tasks are specific and achievable
				
				TASK DESCRIPTION STANDARDS:
				- Provide a concise summary of the task's purpose
				- Do not include implementation details or technical jargon
				- Use clear and straightforward language
				- Do  not include unnecessary details not provided by context, for example sections like: requirements, acceptance criteria, unit test, etc.

				TASK ASSIGNMENT RULES:
				- When assigning, choose the most relevant member based on the task description
				- If no suitable member is found, leave the task unassigned
				
				Current date: ${new Date().toISOString()}
				User locale: ${userContext.locale} (IMPORTANT:ALWAYS respond in this language no matter what)
				`,
				model: "openai/gpt-4o",
				schema: smartCompleteResponseSchema,
				prompt: `Generate a task using the following context, you not need to use tools to complete this task.
					Labels: 
						${JSON.stringify(labels, null, 2)}
					Members: 
						${JSON.stringify(members, null, 2)}

					Task prompt: ${input.prompt}
				`,
			});

			return response.object;
		}),
});
