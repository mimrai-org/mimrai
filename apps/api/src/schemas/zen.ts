import z from "zod";

export const updateZenSettingsSchema = z.object({
	focusGuard: z.object({
		enabled: z.boolean().default(false),
		limit: z.enum(["short", "medium", "long"]).default("short"),
		requireBreaks: z.boolean().default(false),

		focusDurationMinutes: z.number().min(5).max(180).default(25),
		minBreakDurationMinutes: z.number().min(1).max(60).default(5),
		disableSkipBreaks: z.boolean().default(false),
	}),
});
