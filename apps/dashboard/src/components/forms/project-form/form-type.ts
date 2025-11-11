import z from "zod";

export const projectFormSchema = z.object({
	id: z.string().optional(),
	name: z.string().min(1, "Project name is required"),
	description: z.string().optional().nullable(),
	color: z.string().optional().nullable(),
	updatedAt: z.string().optional().nullable(),
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;
