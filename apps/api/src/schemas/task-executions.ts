import z from "zod";

export const getTaskExecutionSchema = z.object({
	taskId: z.string(),
});

export type GetTaskExecutionInput = z.infer<typeof getTaskExecutionSchema>;
