import { shareablePolicyEnum, shareableTypeEnum } from "@db/schema";
import z from "zod";

export const upsertShareableSchema = z.object({
	resourceId: z.string(),
	resourceType: z.enum(shareableTypeEnum.enumValues),
	policy: z.enum(shareablePolicyEnum.enumValues),
	authorizedEmails: z.array(z.string().email()).optional(),
});

export const deleteShareableByResourceSchema = z.object({
	resourceId: z.string(),
	resourceType: z.enum(shareableTypeEnum.enumValues),
});

export const getShareableByIdSchema = z.object({
	id: z.string(),
});

export const getShareableByResourceIdSchema = z.object({
	resourceId: z.string(),
	resourceType: z.enum(shareableTypeEnum.enumValues),
});

export const getShareableResourceSchema = z.object({
	id: z.string(),
});
