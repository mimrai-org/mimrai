import z from "zod";

export const documentFormSchema = z.object({
	id: z.string().optional(),
	name: z.string().min(1, { message: "Document must have a name" }).max(255),
	icon: z.string().nullable().optional(),
	content: z.string().max(100_000).nullable().optional(),
	parentId: z.string().nullable().optional(),
	labels: z.array(z.string()).nullable().optional(),
});
