import z from "zod";

export const taskFormSchema = z.object({
	id: z.string().optional(),
	title: z.string().min(1, { message: "Task must have a title" }).max(255),
	description: z.string().max(50_000).nullable().optional(),
	assigneeId: z.string().nullable().optional(),
	columnId: z.string().min(1),
	dueDate: z.string().nullable().optional(),
	labels: z.array(z.string()).nullable().optional(),
	priority: z.enum(["low", "medium", "high", "urgent"]).nullable().optional(),
	attachments: z.array(z.string()).nullable().optional(),
	showSmartInput: z.boolean().nullable().optional(),
	recurring: z
		.object({
			frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
			interval: z.coerce.number().min(1).max(12),
			startDate: z.string().optional(),
		})
		.nullable()
		.optional(),
});
export type TaskFormValues = z.infer<typeof taskFormSchema>;
