import z from "zod";
import { paginationSchema } from "./base";

export const getColumnsSchema = z.object({
	...paginationSchema.shape,
});
export type GetColumnsInput = z.infer<typeof getColumnsSchema>;

export const createColumnSchema = z.object({
	name: z.string().min(1).max(255),
	description: z.string().max(5000).optional(),
	order: z.number().optional(),
	isFinalState: z.boolean().optional(),
	teamId: z.string(),
});
export type CreateColumnInput = z.infer<typeof createColumnSchema>;

export const updateColumnSchema = z.object({
	id: z.string(),
	name: z.string().min(1).max(255).optional(),
	description: z.string().max(5000).optional(),
	isFinalState: z.boolean().optional(),
	order: z.number().optional(),
});
export type UpdateColumnInput = z.infer<typeof updateColumnSchema>;

export const deleteColumnSchema = z.object({
	id: z.string(),
});
export type DeleteColumnInput = z.infer<typeof deleteColumnSchema>;

export const getColumnByIdSchema = z.object({
	id: z.string(),
});
