import { priorityEnum } from "@db/schema";
import z from "zod";
import { paginationSchema } from "./base";

export const getTasksSchema = z.object({
	...paginationSchema.shape,
	assigneeId: z.array(z.string()).optional(),
	columnId: z.array(z.string()).optional(),
	teamId: z.string().optional(),
	search: z.string().optional(),
	labels: z.array(z.string()).optional(),
});
export type GetTasksInput = z.infer<typeof getTasksSchema>;

export const createTaskSchema = z.object({
	title: z.string().min(1).max(255),
	description: z.string().max(50_000).optional(),
	assigneeId: z.string().optional(),
	columnId: z.string(),
	teamId: z.string(),
	order: z.number().optional(),
	priority: z.enum(priorityEnum.enumValues).optional(),
	labels: z.array(z.string()).optional(),
	dueDate: z.string().optional(),
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z.object({
	id: z.string(),
	teamId: z.string().optional(),
	title: z.string().min(1).max(255).optional(),
	description: z.string().max(50_000).optional(),
	assigneeId: z.string().optional(),
	priority: z.enum(priorityEnum.enumValues).optional(),
	dueDate: z.string().optional(),
	order: z.number().optional(),
	columnId: z.string().optional(),
	labels: z.array(z.string()).optional(),
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
});

export const smartCompleteSchema = z.object({
	prompt: z.string().min(1).max(5000),
});

export const smartCompleteResponseSchema = z.object({
	title: z
		.string()
		.min(1)
		.max(255)
		.describe("Title of the task, must be self explanatory"),
	description: z
		.string()
		.max(50_000)
		.optional()
		.describe("Detailed description of the task"),
	priority: z
		.enum(priorityEnum.enumValues)
		.optional()
		.describe("Priority of the task"),
	dueDate: z
		.string()
		.optional()
		.describe("Due date of the task in ISO 8601 format"),
	labels: z
		.array(z.string())
		.optional()
		.describe(
			"Array of IDs labels to assign to the task. Always try to apply at least one label",
		),
	assigneeId: z
		.string()
		.optional()
		.describe("ID of the user to assign the task to"),
});
