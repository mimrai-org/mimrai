import z from "zod";
import { paginationSchema } from "./base";

export const getTaskViewsSchema = z.object({
	...paginationSchema.shape,
	userId: z.string().optional(),
	projectId: z.string().optional(),
});

export const getTaskViewByIdSchema = z.object({
	id: z.string(),
});

export const getDefaultTaskViewSchema = z.object({
	projectId: z.string().optional(),
});

export const createTaskViewSchema = z.object({
	name: z.string().min(1, "Name is required").max(255),
	description: z.string().max(1000).optional().nullable(),
	projectId: z.string().optional().nullable(),
	viewType: z.string().min(1, "View type is required"),
	filters: z.record(z.string(), z.unknown()),
	isDefault: z.boolean().optional(),
});

export const updateTaskViewSchema = z.object({
	id: z.string(),
	name: z.string().min(1).max(255).optional(),
	description: z.string().max(1000).optional().nullable(),
	viewType: z.string().min(1).optional(),
	filters: z.record(z.string(), z.unknown()).optional(),
	isDefault: z.boolean().optional(),
});

export const setDefaultTaskViewSchema = z.object({
	id: z.string(),
});

export const deleteTaskViewSchema = z.object({
	id: z.string(),
});
