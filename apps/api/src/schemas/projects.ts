import z from "zod";
import { paginationSchema } from "./base";

export const getProjectsSchema = z.object({
	...paginationSchema.shape,
});

export const createProjectSchema = z.object({
	name: z.string().min(1).max(255),
	description: z.string().max(1000).optional().nullable(),
	color: z.string().optional().nullable(),
	archived: z.boolean().optional().nullable(),
});

export const updateProjectSchema = z.object({
	id: z.string(),
	name: z.string().min(1).max(255).optional().nullable(),
	description: z.string().max(1000).optional().nullable(),
	color: z.string().optional().nullable(),
	archived: z.boolean().optional().nullable(),
});
