import type { UIChatMessage } from "@api/ai/types";
import { and, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { db } from "..";
import { chatMessages, chats } from "../schema";

export const getChatById = async (chatId: string, teamId?: string) => {
	const whereClause: SQL[] = [eq(chats.id, chatId)];
	if (teamId) whereClause.push(eq(chats.teamId, teamId));
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
		.orderBy(chatMessages.createdAt);

	return { ...chat, messages: messages.map((m) => m.content) };
};

export const saveChat = async (data: {
	chatId: string;
	teamId?: string;
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
	teamId?: string;
	userId: string;
	message: UIChatMessage;
	createdAt?: string;
}) => {
	const [message] = await db
		.insert(chatMessages)
		.values({
			chatId: data.chatId,
			teamId: data.teamId,
			userId: data.userId,
			content: data.message,
			createdAt: data.createdAt || new Date().toISOString(),
		})
		.returning();

	return message;
};

export const deleteChat = async (chatId: string, teamId: string) => {
	await db
		.delete(chats)
		.where(and(eq(chats.id, chatId), eq(chats.teamId, teamId)));
};

export const getChatHistory = async (teamId: string, search?: string) => {
	const whereClause: SQL[] = [eq(chats.teamId, teamId)];
	if (search) {
		whereClause.push(ilike(chats.title, `%${search}%`));
	}

	const chatsList = await db
		.select()
		.from(chats)
		.where(and(...whereClause))
		.orderBy(desc(chats.createdAt))
		.limit(50);

	return chatsList;
};
