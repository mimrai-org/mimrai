import type { UIChatMessage } from "@api/ai/types";
import { and, desc, eq, ilike, or, type SQL, sql } from "drizzle-orm";
import { db } from "..";
import { chatMessages, chats } from "../schema";

export const getOnlyChatById = async (chatId: string) => {
	const [chat] = await db
		.select()
		.from(chats)
		.where(eq(chats.id, chatId))
		.limit(1);

	return chat || null;
};

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
		.orderBy(
			desc(chatMessages.createdAt),
			desc(sql`CASE WHEN ${chatMessages.role} = 'assistant' THEN 1 ELSE 0 END`),
		)
		.limit(100);

	return { ...chat, messages: messages.map((m) => m.content).reverse() };
};

export const saveChat = async (data: {
	chatId: string;
	teamId?: string;
	summary?: string;
	userId: string;
	title?: string | null;
}) => {
	const [chat] = await db
		.insert(chats)
		.values({
			id: data.chatId,
			teamId: data.teamId,
			summary: data.summary,
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
	role: "user" | "assistant" | "system";
	message: UIChatMessage;
	createdAt?: string;
}) => {
	const [message] = await db
		.insert(chatMessages)
		.values({
			chatId: data.chatId,
			userId: data.userId,
			content: data.message,
			createdAt: data.createdAt || new Date().toISOString(),
			role: data.role,
		})
		.returning();

	return message;
};

export const deleteChat = async (chatId: string, teamId: string) => {
	await db
		.delete(chats)
		.where(and(eq(chats.id, chatId), eq(chats.teamId, teamId)));
};

export const getChatHistory = async ({
	teamId,
	search,
	pageSize = 20,
}: {
	teamId: string;
	search?: string;
	pageSize?: number;
}) => {
	const whereClause: SQL[] = [eq(chats.teamId, teamId)];
	if (search) {
		whereClause.push(ilike(chats.title, `%${search}%`));
	}

	const chatsList = await db
		.select()
		.from(chats)
		.where(and(...whereClause))
		.orderBy(desc(chats.createdAt))
		.limit(pageSize);

	return chatsList;
};
