import z from "zod";

export const activities = {
	created: z.object({
		id: z.string(),
		type: z.string(),
		groupId: z.string().optional(),
		metadata: z.record(z.string(), z.unknown()).optional().nullable(),
	}),
};
