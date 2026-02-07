import z from "zod";

export const agentExecutionPolicySchema = z.object({
	enabled: z.boolean(),
	maxStepsPerDay: z.number().min(1).max(500),
	allowedActions: z.array(
		z.enum([
			"create_task",
			"update_task",
			"create_checklist",
			"update_checklist",
			"create_comment",
			"send_email",
			"web_search",
		]),
	),
	requireReviewForCompletion: z.boolean(),
	alwaysConfirmActions: z.array(z.string()),
});

export const upsertAutopilotSettingsSchema = z.object({
	enabled: z.boolean().optional(),
	enableFollowUps: z.boolean().optional().nullable(),
	allowedWeekdays: z.array(z.number().min(0).max(6)).optional().nullable(),
	agentExecutionPolicy: agentExecutionPolicySchema.optional(),
});
