import { activityStatusEnum, activityTypeEnum } from "@db/schema";
import z from "zod";

export const getActivitiesSchema = z.object({
	groupId: z.string().optional(),
	cursor: z.string().optional(),
	pageSize: z.number().min(1).max(100).optional(),
	priority: z.tuple([z.number(), z.number()]).optional(),
	status: z.array(z.enum(activityStatusEnum.enumValues).optional()).optional(),
	type: z.array(z.enum(activityTypeEnum.enumValues)).optional(),
	search: z.string().optional(),

	onlyForUser: z.boolean().optional(),
});

export const deleteActivitySchema = z.object({
	id: z.string(),
});

export const bulkUpdateActivitiesSchema = z.object({
	ids: z.array(z.string()).min(1),
	status: z.enum(activityStatusEnum.enumValues),
});

export const getActivitiesCountSchema = z.object({
	status: z.array(z.enum(activityStatusEnum.enumValues).optional()).optional(),
});
