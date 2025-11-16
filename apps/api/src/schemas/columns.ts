import { columnTypeEnum } from "@db/schema";
import z from "zod";
import { paginationSchema } from "./base";

export const getColumnsSchema = z.object({
	...paginationSchema.shape,
	type: z.array(z.enum(columnTypeEnum.enumValues)).optional(),
});
export type GetColumnsInput = z.infer<typeof getColumnsSchema>;

export const createColumnSchema = z.object({
	name: z.string().min(1).max(255),
	description: z.string().max(5000).optional(),
	order: z.number().optional(),
	type: z.enum(columnTypeEnum.enumValues),
	teamId: z.string(),
});
export type CreateColumnInput = z.infer<typeof createColumnSchema>;

export const updateColumnSchema = z.object({
	id: z.string(),
	name: z.string().min(1).max(255).optional(),
	description: z.string().max(5000).optional(),
	type: z.enum(columnTypeEnum.enumValues).optional(),
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

export const updateConnectedRepositorySchema = z.object({
	id: z.string(),
	branches: z.array(z.string()).optional(),
});

export const removeTaskFromPullRequestPlanSchema = z.object({
	taskIds: z.array(z.string()),
});
