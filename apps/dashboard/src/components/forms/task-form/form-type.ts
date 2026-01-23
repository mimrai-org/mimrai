import z from "zod";

export const taskFormSchema = z.object({
	id: z.string().optional(),
	sequence: z.number().optional(),
	permalinkId: z.string().optional(),
	title: z.string().min(1, { message: "Task must have a title" }).max(255),
	description: z.string().max(50_000).nullable().optional(),
	assigneeId: z.string().nullable().optional(),
	milestoneId: z.string().nullable().optional(),
	statusId: z.string().min(1),
	dueDate: z.string().nullable().optional(),
	labels: z.array(z.string()).nullable().optional(),
	priority: z.enum(["low", "medium", "high", "urgent"]).nullable().optional(),
	attachments: z.array(z.string()).nullable().optional(),
	attachmentsUploadingState: z
		.array(
			z.custom<{
				id: string;
				url: string;
				progress?: number;
			}>(),
		)
		.nullable()
		.optional(),
	projectId: z.string(),
	repositoryName: z.string().nullable().optional(),
	branchName: z.string().nullable().optional(),
	showSmartInput: z.boolean().nullable().optional(),
	recurring: z
		.object({
			frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
			interval: z.coerce.number().min(1).max(12),
			startDate: z
				.string()
				.default(() => new Date().toISOString())
				.optional(),
		})
		.transform((val) => (val.frequency && val.interval ? val : null))
		.nullable()
		.optional(),
});
export type TaskFormValues = z.infer<typeof taskFormSchema>;
