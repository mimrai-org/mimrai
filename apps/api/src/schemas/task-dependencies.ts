import z from "zod";

export const taskDependencyTypeSchema = z.enum(["blocks", "relates_to"]);

export const getTaskDependenciesSchema = z.object({
	taskId: z.string(),
});

export const createTaskDependencySchema = z.object({
	taskId: z.string(),
	dependsOnTaskId: z.string(),
	type: taskDependencyTypeSchema.default("relates_to"),
	explanation: z.string().optional(),
});

export const updateTaskDependencySchema = z.object({
	taskId: z.string(),
	dependsOnTaskId: z.string(),
	type: taskDependencyTypeSchema.optional(),
	explanation: z.string().nullable().optional(),
});

export const deleteTaskDependencySchema = z.object({
	taskId: z.string(),
	dependsOnTaskId: z.string(),
});

export const getAvailableTaskDependenciesSchema = z.object({
	taskId: z.string(),
	search: z.string().optional(),
	pageSize: z.number().min(1).max(100).default(10),
});
