import { projectStatusEnum } from "@mimir/db/schema";
import z from "zod";
import { paginationSchema } from "./base";

export const projectVisibilitySchema = z.enum(["team", "private"]);

export const getProjectsSchema = z.object({
	...paginationSchema.shape,
	search: z.string().optional(),
});

export const createProjectSchema = z.object({
	name: z.string().min(1).max(255),
	description: z.string().max(2000).optional().nullable(),
	color: z.string().optional().nullable(),
	archived: z.boolean().optional().nullable(),
	startDate: z.string().optional().nullable(),
	endDate: z.string().optional().nullable(),
	leadId: z.string().optional().nullable(),
	visibility: projectVisibilitySchema.optional().nullable(),
	memberIds: z.array(z.string()).optional().nullable(),
});

export const updateProjectSchema = z.object({
	id: z.string(),
	name: z.string().min(1).max(255).optional().nullable(),
	description: z.string().max(2000).optional().nullable(),
	color: z.string().optional().nullable(),
	archived: z.boolean().optional().nullable(),
	startDate: z.string().optional().nullable(),
	endDate: z.string().optional().nullable(),
	leadId: z.string().optional().nullable(),
	status: z.enum(projectStatusEnum.enumValues).optional().nullable(),
	visibility: projectVisibilitySchema.optional().nullable(),
	memberIds: z.array(z.string()).optional().nullable(),
});

export const addProjectMemberSchema = z.object({
	projectId: z.string(),
	userId: z.string(),
});

export const removeProjectMemberSchema = z.object({
	projectId: z.string(),
	userId: z.string(),
});

export const getProjectMembersSchema = z.object({
	projectId: z.string(),
});
