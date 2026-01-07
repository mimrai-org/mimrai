import type { CreateTaskInput } from "@db/queries/tasks";
import z from "zod";
import { paginationSchema } from "./base";

export const getInboxSchema = z.object({
	...paginationSchema.shape,
	seen: z.boolean().optional(),
	status: z
		.array(z.enum(["archived", "accepted", "dismissed", "pending"]))
		.optional(),
});

export const createInboxSchema = z.object({
	display: z.string().min(1, "Display is required"),
	source: z.string().min(1, "Source is required"),
	sourceId: z.string().min(1, "Source ID is required"),
	payload: z.custom<CreateTaskInput>(),
});

export const updateInboxSchema = z.object({
	id: z.string(),
	display: z.string().optional(),
	status: z.enum(["archived", "accepted", "dismissed", "pending"]).optional(),
	seen: z.boolean().optional(),
	source: z.string().optional(),
	sourceId: z.string().optional(),
	payload: z.custom<CreateTaskInput>().optional(),
});

export const getInboxByIdSchema = z.object({
	id: z.string(),
});

export const deleteInboxSchema = z.object({
	id: z.string(),
});
