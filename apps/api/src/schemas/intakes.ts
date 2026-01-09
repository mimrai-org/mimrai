import type { CreateTaskInput } from "@mimir/db/queries/tasks";
import z from "zod";
import { paginationSchema } from "./base";

export const getIntakesSchema = z.object({
	...paginationSchema.shape,
	status: z.array(z.enum(["accepted", "dismissed", "pending"])).optional(),
});

export const createIntakeSchema = z.object({
	source: z.string().min(1, "Source is required"),
	sourceId: z.string().min(1, "Source ID is required"),
	inboxId: z.string().optional(),
	assigneeId: z.string().optional(),
	reasoning: z.string().optional(),
	payload: z.custom<CreateTaskInput>(),
});

export const updateIntakeSchema = z.object({
	id: z.string(),
	source: z.string().optional(),
	sourceId: z.string().optional(),
	status: z.enum(["accepted", "dismissed", "pending"]).optional(),
	reasoning: z.string().optional(),
	payload: z.custom<CreateTaskInput>().optional(),
	taskId: z.string().optional(),
});

export const getIntakeByIdSchema = z.object({
	id: z.string(),
});

export const deleteIntakeSchema = z.object({
	id: z.string(),
});
