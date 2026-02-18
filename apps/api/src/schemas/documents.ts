import z from "zod";
import { paginationSchema } from "./base";

export const getDocumentsSchema = z.object({
	...paginationSchema.shape,
	parentId: z.string().nullable().optional(),
	search: z.string().optional(),
	tree: z.boolean().optional(),
	labels: z.array(z.string()).optional(),
});

export const getDocumentByIdSchema = z.object({
	id: z.string(),
});

export const createDocumentSchema = z.object({
	name: z.string(),
	icon: z.string().nullable().optional(),
	content: z.string().optional(),
	parentId: z.string().optional(),
	labels: z.array(z.string()).optional(),
});

export const updateDocumentSchema = z.object({
	id: z.string(),
	name: z.string(),
	icon: z.string().nullable().optional(),
	content: z.string().optional(),
	parentId: z.string().nullable().optional(),
	labels: z.array(z.string()).optional(),
});

export const deleteDocumentSchema = z.object({
	id: z.string(),
});

export const getDocumentPathSchema = z.object({
	id: z.string(),
});

export const reorderDocumentsSchema = z.object({
	items: z.array(
		z.object({
			id: z.string(),
			order: z.number(),
			parentId: z.string().nullable().optional(),
		}),
	),
});
