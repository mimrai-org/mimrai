import {
	bulkDeleteTaskSchema,
	bulkUpdateTaskSchema,
	cloneTaskSchema,
	commentTaskSchema,
	createTaskSchema,
	deleteTaskCommentSchema,
	deleteTaskSchema,
	getDuplicatedTasksSchema,
	getTaskSubscribersSchema,
	getTasksSchema,
	smartCompleteSchema,
	subscribeTaskSchema,
	unsubscribeTaskSchema,
	updateTaskCommentSchema,
	updateTaskSchema,
} from "@api/schemas/tasks";
import { protectedProcedure, router } from "@api/trpc/init";
import { buildSmartCompletePrompt } from "@api/utils/smart-complete";
import {
	bulkDeleteTask,
	bulkUpdateTask,
	cloneTask,
	createTask,
	createTaskComment,
	deleteTask,
	deleteTaskComment,
	getTaskById,
	getTaskByPermalinkId,
	getTaskSubscribers,
	getTasks,
	subscribeUserToTask,
	unsubscribeUserFromTask,
	updateTask,
	updateTaskComment,
	updateTaskRecurringJob,
} from "@mimir/db/queries/tasks";
import { getDuplicateTaskEmbedding } from "@mimir/db/queries/tasks-embeddings";
import { getMemberById } from "@mimir/db/queries/teams";
import { trackTaskCreated } from "@mimir/events/server";
import { syncGoogleCalendarTaskEvent } from "@mimir/integration/google-calendar";
import { createRecurringTaskJob } from "@mimir/jobs/tasks/create-recurring-task-job";
import { runs } from "@trigger.dev/sdk";
import z from "zod";

export const tasksRouter = router({
	get: protectedProcedure
		.input(getTasksSchema.optional())
		.query(({ ctx, input }) => {
			return getTasks({
				pageSize: 100,
				...input,
				teamId: ctx.user.teamId!,
				userId: ctx.user.id,
			});
		}),

	create: protectedProcedure
		.input(createTaskSchema)
		.mutation(async ({ ctx, input }) => {
			const task = await createTask({
				...input,
				userId: ctx.user.id,
				teamId: ctx.user.teamId!,
			});

			trackTaskCreated({
				userId: ctx.user.id,
				teamId: ctx.team.id,
				teamName: ctx.team.name,
				source: "api",
			});

			// If recurring is set, schedule the first occurrence
			if (task.recurring) {
				// Schedule the job to create the next occurrence
				await createRecurringTaskJob.trigger({
					originalTaskId: task.id,
				});
			}

			if (task.dueDate) {
				// Sync the calendar event
				syncGoogleCalendarTaskEvent({
					taskId: task.id,
					teamId: ctx.user.teamId!,
				});
			}

			return task;
		}),

	clone: protectedProcedure
		.input(cloneTaskSchema)
		.mutation(async ({ ctx, input }) => {
			return cloneTask({
				taskId: input.taskId,
				userId: ctx.user.id,
				teamId: ctx.user.teamId!,
			});
		}),

	update: protectedProcedure
		.input(updateTaskSchema)
		.mutation(async ({ ctx, input }) => {
			const oldTask = await getTaskById(input.id, ctx.user.id);
			const task = await updateTask({
				...input,
				userId: ctx.user.id,
				teamId: ctx.user.teamId!,
			});

			// If recurring is set, schedule the first occurrence
			if (task.recurring?.interval && task.recurring?.frequency) {
				const existingJob = task.recurringJobId;
				if (existingJob) {
					// If there's an existing job, we might want to cancel it first
					try {
						await runs.cancel(existingJob);
					} catch (error) {
						// Failed to cancel existing job, log and continue
						console.warn(
							`Failed to cancel existing recurring job with ID ${existingJob} for task ID ${task.id}:`,
							error,
						);
					}
					await updateTaskRecurringJob({
						jobId: null,
						taskId: task.id,
					});
				}
				// Schedule the job to create the next occurrence
				await createRecurringTaskJob.trigger({
					originalTaskId: task.id,
				});
			} else if (oldTask.recurringJobId) {
				// If recurring was removed, cancel any existing job
				try {
					await runs.cancel(oldTask.recurringJobId);
				} catch (error) {
					// Failed to cancel existing job, log and continue
					console.warn(
						`Failed to cancel existing recurring job with ID ${oldTask.recurringJobId} for task ID ${task.id}:`,
						error,
					);
				}
				await updateTaskRecurringJob({
					jobId: null,
					taskId: task.id,
				});
			}

			if (
				oldTask.dueDate !== task.dueDate ||
				oldTask.subscribers !== task.subscribers
			) {
				// Due date or subscribers changed, sync the calendar event
				syncGoogleCalendarTaskEvent({
					taskId: task.id,
					teamId: ctx.user.teamId!,
					oldSubscribers: oldTask.subscribers,
				});
			}

			return task;
		}),
	updateDescription: protectedProcedure
		.input(
			updateTaskSchema.pick({
				id: true,
				description: true,
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return updateTask({
				...input,
				userId: ctx.user.id,
				teamId: ctx.user.teamId!,
			});
		}),

	bulkUpdate: protectedProcedure
		.input(bulkUpdateTaskSchema)
		.mutation(async ({ ctx, input }) => {
			return bulkUpdateTask({
				...input,
				userId: ctx.user.id,
				teamId: ctx.user.teamId!,
			});
		}),
	bulkDelete: protectedProcedure
		.input(bulkDeleteTaskSchema)
		.mutation(async ({ ctx, input }) => {
			return bulkDeleteTask({
				...input,
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
			return getTaskById(input.id, ctx.user.id);
		}),
	getByPermalinkId: protectedProcedure
		.input(z.object({ permalinkId: z.string() }))
		.query(async ({ ctx, input }) => {
			return getTaskByPermalinkId(input.permalinkId, ctx.user.id);
		}),

	comment: protectedProcedure
		.input(commentTaskSchema)
		.mutation(async ({ ctx, input }) => {
			const comment = await createTaskComment({
				taskId: input.id,
				comment: input.comment,
				replyTo: input.replyTo,
				userId: ctx.user.id,
				teamId: ctx.user.teamId!,
				mentions: input.mentions,
				metadata: input.metadata,
			});

			// Try to handle the comment with AI integration
			// handleTaskComment({
			// 	taskId: input.id,
			// 	teamId: ctx.user.teamId!,
			// 	userId: ctx.user.id,
			// 	commentId: comment.id,
			// 	comment: input.comment,
			// });

			return comment;
		}),
	deleteComment: protectedProcedure
		.input(deleteTaskCommentSchema)
		.mutation(async ({ ctx, input }) => {
			return deleteTaskComment({
				commentId: input.id,
				teamId: ctx.user.teamId!,
			});
		}),
	updateComment: protectedProcedure
		.input(updateTaskCommentSchema)
		.mutation(async ({ ctx, input }) => {
			return updateTaskComment({
				...input,
				commentId: input.id,
				taskId: input.taskId,
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
			const systemPrompt = await buildSmartCompletePrompt({
				userPrompt: input.prompt,
				userId: ctx.user.id,
				teamId: ctx.user.teamId!,
			});

			return {};

			// const response = await generateText({
			// 	system: systemPrompt,
			// 	model: openai("gpt-4o-mini"),
			// 	output: Output.object({ schema: smartCompleteResponseSchema }),
			// 	prompt: `Create a task based on the user's prompt: "${input.prompt}"`,
			// });

			// const meter = createTokenMeter(ctx.team.customerId!);
			// meter({
			// 	model: "openai/gpt-4o-mini",
			// 	usage: response.usage,
			// });

			// trackMessage({
			// 	userId: ctx.user.id,
			// 	teamId: ctx.user.teamId!,
			// 	source: "smart-complete",
			// });

			// return response.output;
		}),

	getSubscribers: protectedProcedure
		.input(getTaskSubscribersSchema)
		.query(async ({ ctx, input }) => {
			return await getTaskSubscribers({
				taskId: input.id,
				teamId: ctx.user.teamId!,
			});
		}),

	unsubscribe: protectedProcedure
		.input(unsubscribeTaskSchema)
		.mutation(async ({ ctx, input }) => {
			return await unsubscribeUserFromTask({
				taskId: input.id,
				userId: ctx.user.id,
				teamId: ctx.user.teamId!,
			});
		}),

	subscribe: protectedProcedure
		.input(subscribeTaskSchema)
		.mutation(async ({ ctx, input }) => {
			const userOnTeam = await getMemberById({
				userId: input.userId,
				teamId: ctx.user.teamId!,
			});

			if (!userOnTeam) {
				throw new Error("User not found on team");
			}

			return await subscribeUserToTask({
				taskId: input.id,
				userId: input.userId,
				teamId: ctx.user.teamId!,
			});
		}),
});
