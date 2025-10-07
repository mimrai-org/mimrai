import { activityTypeEnum } from "@db/schema";
import z from "zod";

export const getActivitiesSchema = z.object({
	groupId: z.string().optional(),
	cursor: z.string().optional(),
	pageSize: z.number().min(1).max(100).optional(),
	type: z.array(z.enum(activityTypeEnum.enumValues)).optional(),
});
