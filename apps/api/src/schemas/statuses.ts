import { statusTypeEnum } from "@db/schema";
import z from "zod";
import { paginationSchema } from "./base";

export const getColumnsSchema = z.object({
	...paginationSchema.shape,
	type: z.array(z.enum(statusTypeEnum.enumValues)).optional(),
});
export type GetColumnsInput = z.infer<typeof getColumnsSchema>;

export const createColumnSchema = z.object({
	name: z.string().min(1).max(255),
	description: z.string().max(5000).optional(),
	order: z.number().optional(),
	type: z.enum(statusTypeEnum.enumValues),
	teamId: z.string(),
});
export type CreateColumnInput = z.infer<typeof createColumnSchema>;

export const updateColumnSchema = z.object({
	id: z.string(),
	name: z.string().min(1).max(255).optional(),
	description: z.string().max(5000).optional(),
	type: z.enum(statusTypeEnum.enumValues).optional(),
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

export const reorderColumnSchema = z.object({
	items: z.array(
		z.object({
			id: z.string(),
			order: z.number(),
		}),
	),
});
export type ReorderColumnInput = z.infer<typeof reorderColumnSchema>;

export const updateConnectedRepositorySchema = z.object({
	id: z.string(),
	branches: z.array(z.string()).optional(),
});

export const removeTaskFromPullRequestPlanSchema = z.object({
	taskIds: z.array(z.string()),
});

export const getPrReviewsSchema = z.object({
	pageSize: z.number().min(1).max(100).optional(),
	cursor: z.string().optional(),
	state: z.array(z.enum(["open", "closed"])).optional(),
	reviewerId: z.string().optional(),
	assigneeId: z.string().optional(),
	includeIds: z.array(z.string()).optional(),
});

export const getPrReviewsCountSchema = z.object({
	state: z.array(z.enum(["open", "closed"])).optional(),
});
