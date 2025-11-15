import type { UIChatMessage } from "@api/ai/types";
import z from "zod";

export const messageSchema = z.custom<UIChatMessage>();

export const chatRequestSchema = z.object({
	id: z.string(),
	message: messageSchema,
	country: z.string().optional(),
	city: z.string().optional(),
	region: z.string().optional(),
	timezone: z.string().optional(),
	agentChoice: z.string().optional().openapi({
		description: "Agent choice",
		example: "general",
	}),
	toolChoice: z.string().optional().openapi({
		description: "Tool choice",
		example: "createTask",
	}),
});

export const chatMessageSchema = messageSchema;

export const chatResponseSchema = z.object({
	messages: z.array(messageSchema),
});

export const getChatSchema = z.object({
	chatId: z.string(),
});

export const getChatHistorySchema = z.object({
	search: z.string().optional(),
});
