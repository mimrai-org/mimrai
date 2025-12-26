import z from "zod";
import { paginationSchema } from "./base";

export const projectHealthEnum = z.enum(["on_track", "at_risk", "off_track"]);

export const getProjectHealthUpdatesSchema = z.object({
	projectId: z.string(),
	...paginationSchema.shape,
});

export const createProjectHealthUpdateSchema = z.object({
	projectId: z.string(),
	health: projectHealthEnum,
	summary: z.string().max(5000).optional().nullable(),
});

export const updateProjectHealthUpdateSchema = z.object({
	id: z.string(),
	health: projectHealthEnum.optional(),
	summary: z.string().max(5000).optional().nullable(),
});
