import z from "zod";

export const listApiKeysSchema = z.object({});

export const createApiKeySchema = z.object({
	name: z.string().min(1, "Name is required").max(100),
	expiresIn: z.number().int().positive().optional(),
	permissions: z
		.record(z.string(), z.array(z.string()))
		.optional()
		.default({
			tasks: ["read", "write"],
			projects: ["read", "write"],
			milestones: ["read", "write"],
			labels: ["read", "write"],
		}),
});

export const deleteApiKeySchema = z.object({
	id: z.string().min(1, "API key ID is required"),
});
