import z from "zod";

export const projectFormSchema = z.object({
	id: z.string().optional(),
	name: z.string().min(1, "Project name is required"),
	description: z.string().optional().nullable(),
	color: z.string().optional().nullable(),
	startDate: z.string().optional().nullable(),
	endDate: z.string().optional().nullable(),
	status: z
		.enum(["planning", "in_progress", "completed", "on_hold"])
		.optional()
		.nullable(),
	memberIds: z.array(z.string()).optional(),
	leadId: z.string().optional().nullable(),
	visibility: z.enum(["team", "private"]).optional().nullable(),
	updatedAt: z.string().optional().nullable(),
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;
