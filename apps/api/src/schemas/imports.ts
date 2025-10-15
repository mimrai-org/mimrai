import { taskImportStatusEnum } from "@db/schema";
import z from "zod";

export const getImportsSchema = z.object({
	status: z.array(z.literal(taskImportStatusEnum.enumValues)).optional(),
	cursor: z.string().optional(),
	pageSize: z.number().optional(),
});
