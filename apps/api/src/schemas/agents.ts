import z from "zod";
import { paginationSchema } from "./base";

export const getAgentsSchema = z.object({
	...paginationSchema.shape,
	isActive: z.boolean().optional(),
});

export const getAgentByIdSchema = z.object({
	id: z.string(),
});

export const createAgentSchema = z.object({
	name: z.string().min(1, "Name is required"),
	description: z.string().optional(),
	avatar: z.string().optional(),
	isActive: z.boolean().default(true).optional(),
	authorizeIntegrations: z.boolean().optional(),
	activeToolboxes: z.string().array().optional(),
	model: z.string().optional(),
	soul: z.string().optional(),
});

export const updateAgentSchema = z.object({
	id: z.string(),
	name: z.string().min(1, "Name is required").optional(),
	description: z.string().optional(),
	avatar: z.string().optional(),
	isActive: z.boolean().optional(),
	authorizeIntegrations: z.boolean().optional(),
	activeToolboxes: z.string().array().optional(),
	model: z.string().optional(),
	soul: z.string().optional(),
});

export const deleteAgentSchema = z.object({
	id: z.string(),
});

export const getAgentMemoriesSchema = z.object({
	agentId: z.string(),
	category: z.enum(["lesson", "preference", "fact", "procedure"]).optional(),
	limit: z.number().min(1).max(100).default(50).optional(),
});

export const deleteAgentMemorySchema = z.object({
	id: z.string(),
});
