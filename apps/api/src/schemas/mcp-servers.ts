import z from "zod";

const mcpHeadersSchema = z.record(z.string(), z.string()).optional();

const mcpConfigSchema = z.object({
	url: z.string().url("Must be a valid URL"),
	headers: mcpHeadersSchema,
	scopes: z.array(z.string()).optional(),
});

export const createMcpServerSchema = z.object({
	name: z.string().min(1, "Name is required").max(100),
	description: z.string().max(500).optional(),
	transport: z.enum(["http", "sse"]).default("http"),
	config: mcpConfigSchema,
});

export const updateMcpServerSchema = z.object({
	id: z.string(),
	name: z.string().min(1, "Name is required").max(100).optional(),
	description: z.string().max(500).optional(),
	transport: z.enum(["http", "sse"]).optional(),
	config: mcpConfigSchema.optional(),
	isActive: z.boolean().optional(),
});

export const getMcpServerByIdSchema = z.object({
	id: z.string(),
});

export const getMcpServersSchema = z.object({
	activeOnly: z.boolean().optional(),
});

export const deleteMcpServerSchema = z.object({
	id: z.string(),
});
