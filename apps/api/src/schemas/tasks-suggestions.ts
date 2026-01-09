import { taskSuggestionsStatusEnum } from "@mimir/db/schema";
import z from "zod";

export const acceptTaskSuggestionSchema = z.object({
	id: z.string(),
});

export const rejectTaskSuggestionSchema = z.object({
	id: z.string().optional(),
});

export const getTasksSuggestionsSchema = z.object({
	status: z.array(z.enum(taskSuggestionsStatusEnum.enumValues)).optional(),
	pageSize: z.number().min(1).max(100).optional(),
});
