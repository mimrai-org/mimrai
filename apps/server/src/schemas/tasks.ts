import z from "zod";
import { paginationSchema } from "./base";

export const getTasksSchema = z.object({
	...paginationSchema.shape,
	assigneeId: z.array(z.string()).optional(),
	columnId: z.array(z.string()).optional(),
	teamId: z.string().optional(),
	search: z.string().optional(),
});
export type GetTasksInput = z.infer<typeof getTasksSchema>;

export const createTaskSchema = z.object({
	title: z.string().min(1).max(255),
	description: z.string().max(5000).optional(),
	assigneeId: z.string().optional(),
	columnId: z.string(),
	teamId: z.string(),
	order: z.number().optional(),
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z.object({
	id: z.string(),
	title: z.string().min(1).max(255).optional(),
	description: z.string().max(5000).optional(),
	assigneeId: z.string().optional(),
	order: z.number().optional(),
	columnId: z.string().optional(),
});
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const deleteTaskSchema = z.object({
	id: z.string(),
});
export type DeleteTaskInput = z.infer<typeof deleteTaskSchema>;
