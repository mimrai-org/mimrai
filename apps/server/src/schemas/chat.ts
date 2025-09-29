import z from "zod";
import type { UIChatMessage } from "@/ai/types";

export const messageSchema = z.custom<UIChatMessage>();

export const chatRequestSchema = z.object({
	id: z.string(),
	message: messageSchema,
	country: z.string().optional(),
	city: z.string().optional(),
	region: z.string().optional(),
	timezone: z.string().optional(),
});

export const chatMessageSchema = messageSchema;

export const chatResponseSchema = z.object({
	messages: z.array(messageSchema),
});
