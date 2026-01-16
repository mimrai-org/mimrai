import z from "zod";

export const taskViewFormSchema = z.object({
	id: z.string().optional(),
	name: z.string().min(1, { message: "View must have a name" }).max(100),
	description: z.string().max(500).nullable().optional(),
	viewType: z.string(),
	filters: z.record(z.any(), z.unknown()),
	isDefault: z.boolean().optional(),
	projectId: z.string().optional(),
});

export type TaskViewFormValues = z.infer<typeof taskViewFormSchema>;
