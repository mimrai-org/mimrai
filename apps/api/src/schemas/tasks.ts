import {
	activityStatusEnum,
	priorityEnum,
	shareablePolicyEnum,
	statusTypeEnum,
} from "@mimir/db/schema";
import z from "zod";
import { paginationSchema } from "./base";

export enum TaskView {
	board = "board",
	backlog = "backlog",
}
export const taskViewEnum = z.enum([...Object.values(TaskView)]);

export const getTasksSchema = z.object({
	...paginationSchema.shape,
	assigneeId: z.array(z.string()).optional().nullable(),
	statusId: z.array(z.string()).optional().nullable(),
	statusType: z.array(z.enum(statusTypeEnum.enumValues)).optional().nullable(),
	teamId: z.string().optional().nullable(),
	projectId: z.array(z.string()).optional().nullable(),
	nProjectId: z.array(z.string()).optional().nullable(),
	milestoneId: z.array(z.string()).optional().nullable(),
	search: z.string().optional().nullable(),
	labels: z.array(z.string()).optional().nullable(),
	view: z.enum(["board", "list", "calendar"]).optional().nullable(),
	recurring: z.boolean().optional().nullable(),
});
export type GetTasksInput = z.infer<typeof getTasksSchema>;

export const createTaskSchema = z.object({
	title: z.string().min(1).max(255),
	description: z.string().max(50_000).nullable().optional(),
	assigneeId: z.string().nullable().optional(),
	statusId: z.string(),
	order: z.number().nullable().optional(),
	priority: z.enum(priorityEnum.enumValues).nullable().optional(),
	labels: z.array(z.string()).nullable().optional(),
	dueDate: z.string().nullable().optional(),
	milestoneId: z.string().nullable().optional(),
	projectId: z.string(),
	mentions: z.array(z.string()).nullable().optional(),
	repositoryName: z.string().nullable().optional(),
	branchName: z.string().nullable().optional(),
	recurring: z
		.object({
			startDate: z.string().optional(),
			frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
			interval: z.number().min(1).max(365),
		})
		.nullable()
		.optional(),
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const cloneTaskSchema = z.object({
	taskId: z.string(),
});

export const updateTaskSchema = z.object({
	id: z.string(),
	title: z.string().min(1).max(255).optional(),
	description: z.string().max(50_000).nullable().optional(),
	assigneeId: z.string().nullable().optional(),
	priority: z.enum(priorityEnum.enumValues).nullable().optional(),
	dueDate: z.string().nullable().optional(),
	order: z.number().nullable().optional(),
	focusOrder: z.number().nullable().optional(),
	statusId: z.string().optional(),
	milestoneId: z.string().nullable().optional(),
	labels: z.array(z.string()).nullable().optional(),
	mentions: z.array(z.string()).nullable().optional(),
	projectId: z.string().optional().nullable(),
	repositoryName: z.string().nullable().optional(),
	branchName: z.string().nullable().optional(),
	recurring: z
		.object({
			frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
			interval: z.coerce.number().min(1).max(365),
			startDate: z.string().nullable().optional(),
		})
		.nullable()
		.optional(),
});
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const deleteTaskSchema = z.object({
	id: z.string(),
	teamId: z.string().optional(),
});
export type DeleteTaskInput = z.infer<typeof deleteTaskSchema>;

export const commentTaskSchema = z.object({
	id: z.string(),
	comment: z.string().min(1).max(5000),
	replyTo: z.string().nullable().optional(),
	mentions: z.array(z.string()).nullable().optional(),
	metadata: z
		.record(z.string(), z.number().or(z.string()).or(z.boolean()))
		.refine((arg) => {
			const keys = Object.keys(arg);
			for (const key of keys) {
				const value = arg[key];
				// prevent long values
				if (typeof value === "string" && value.length > 1000) {
					return false;
				}
			}

			//prevent abuse by limiting number of keys
			return keys.length <= 10;
		})
		.nullable()
		.optional(),
});

export const deleteTaskCommentSchema = z.object({
	id: z.string(),
});

export const updateTaskCommentSchema = z.object({
	id: z.string(),
	comment: z.string().min(1).max(5000).optional(),
	taskId: z.string(),
	mentions: z.array(z.string()).nullable().optional(),
	status: z.enum(activityStatusEnum.enumValues).optional(),
});

export const smartCompleteSchema = z.object({
	prompt: z.string().min(1).max(5000),
});

export const getDuplicatedTasksSchema = z.object({
	title: z.string().min(1).max(255),
});

export const getTaskSubscribersSchema = z.object({
	id: z.string(),
});

export const unsubscribeTaskSchema = z.object({
	id: z.string(),
});

export const subscribeTaskSchema = z.object({
	id: z.string(),
	userId: z.string(),
});

export const shareTaskSchema = z.object({
	id: z.string(),
	authorizedEmails: z.array(z.string().email()).optional(),
	policy: z.enum(shareablePolicyEnum.enumValues),
});

export const getZenModeQueueSchema = z.object({});
