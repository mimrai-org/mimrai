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
	category: z.enum(["preference", "fact", "procedure"]).optional(),
	query: z.string().optional(),
	limit: z.number().min(1).max(100).default(50).optional(),
});

export const deleteAgentMemorySchema = z.object({
	id: z.string(),
});

export const getDocumentsForAgentSchema = z.object({
	agentId: z.string(),
});

export const addDocumentToAgentSchema = z.object({
	agentId: z.string(),
	documentId: z.string(),
});

export const removeDocumentFromAgentSchema = z.object({
	agentId: z.string(),
	documentId: z.string(),
});
