import z from "zod";

export const upsertAutopilotSettingsSchema = z.object({
	enabled: z.boolean().optional(),
	enableFollowUps: z.boolean().optional(),
	allowedWeekdays: z.array(z.number().min(0).max(6)).optional(),
});
