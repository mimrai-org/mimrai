import { and, eq } from "drizzle-orm";
import type { UIChatMessage } from "@/ai/types";
import { db } from "..";
import { chatMessages, chats } from "../schema/schemas";

export const getChatById = async (chatId: string, teamId: string) => {
	const [chat] = await db
		.select()
		.from(chats)
		.where(and(eq(chats.id, chatId), eq(chats.teamId, teamId)))
		.limit(1);

	if (!chat) {
		return null;
	}

	const messages = await db
		.select()
		.from(chatMessages)
		.where(
			and(eq(chatMessages.chatId, chatId), eq(chatMessages.teamId, teamId)),
		)
		.orderBy(chatMessages.createdAt);

	return { ...chat, messages: messages.map((m) => m.content) };
};

export const saveChat = async (data: {
	chatId: string;
	teamId: string;
	userId: string;
	title?: string | null;
}) => {
	const [chat] = await db
		.insert(chats)
		.values({
			id: data.chatId,
			teamId: data.teamId,
			userId: data.userId,
			title: data.title,
			updatedAt: new Date().toISOString(),
		})
		.onConflictDoUpdate({
			target: chats.id,
			set: {
				...(data.title && { title: data.title }),
				updatedAt: new Date().toISOString(),
			},
		})
		.returning();

	return chat;
};

export const saveChatMessage = async (data: {
	chatId: string;
	teamId: string;
	userId: string;
	message: UIChatMessage;
}) => {
	const [message] = await db
		.insert(chatMessages)
		.values({
			chatId: data.chatId,
			teamId: data.teamId,
			userId: data.userId,
			content: data.message,
		})
		.returning();

	return message;
};

export const deleteChat = async (chatId: string, teamId: string) => {
	await db
		.delete(chats)
		.where(and(eq(chats.id, chatId), eq(chats.teamId, teamId)));
};
