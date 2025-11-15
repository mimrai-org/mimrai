import type { UIChatMessage } from "@api/ai/types";
import { and, eq, type SQL } from "drizzle-orm";
import { db } from "..";
import { chatMessages, chats } from "../schema";

export const getChatById = async (chatId: string, userId?: string) => {
	const whereClause: SQL[] = [eq(chats.chatId, chatId)];
	if (userId) whereClause.push(eq(chats.userId, userId));
	const [chat] = await db
		.select()
		.from(chats)
		.where(and(...whereClause))
		.limit(1);

	if (!chat) {
		return null;
	}

	const messages = await db
		.select()
		.from(chatMessages)
		.where(and(eq(chatMessages.chatId, chatId)))
		.orderBy(chatMessages.timestamp);

	return { ...chat, messages: messages.map((m) => m.content) };
};

export const saveChat = async (data: {
	chatId: string;
	userId: string;
	title?: string | null;
}) => {
	const [chat] = await db
		.insert(chats)
		.values({
			chatId: data.chatId,
			userId: data.userId,
			title: data.title,
			createdAt: new Date(),
			updatedAt: new Date(),
		})
		.onConflictDoUpdate({
			target: chats.chatId,
			set: {
				...(data.title && { title: data.title }),
				updatedAt: new Date(),
			},
		})
		.returning();

	return chat;
};

export const saveChatMessage = async (data: {
	id?: string;
	chatId: string;
	userId: string;
	message: UIChatMessage;
	createdAt?: Date;
}) => {
	const [message] = await db
		.insert(chatMessages)
		.values({
			id: data.id,
			chatId: data.chatId,
			userId: data.userId,
			role: data.message.role,
			content: JSON.stringify(data.message),
			timestamp: data.createdAt || new Date(),
		})
		.returning();

	return message;
};

export const deleteChat = async (chatId: string, userId: string) => {
	await db
		.delete(chats)
		.where(and(eq(chats.chatId, chatId), eq(chats.userId, userId)));
};
