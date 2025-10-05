import z from "zod";

export const paginationSchema = z.object({
	cursor: z.string().optional(),
	pageSize: z.number().min(1).max(100).default(20),
});
