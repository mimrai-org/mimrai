import type {
	ChatSession,
	ConversationMessage,
	MemoryProvider,
	MemoryScope,
	WorkingMemory,
} from "@ai-sdk-tools/memory";
import type { UIChatMessage } from "@api/ai/types";
import type { Database } from "@mimir/db/client";
import { chatMessages, chats, users, workingMemory } from "@mimir/db/schema";
import { and, desc, eq, like, sql } from "drizzle-orm";

export class DrizzleProvider implements MemoryProvider {
	constructor(private db: Database) {}

	async getWorkingMemory(params: {
		chatId?: string;
		userId?: string;
		scope: MemoryScope;
	}): Promise<WorkingMemory | null> {
		const [result] = await this.db
			.select()
			.from(workingMemory)
			.where(eq(workingMemory.userId, params.userId!))
			.limit(1);

		if (!result) {
			return null;
		}

		return {
			content: result.content,
			updatedAt: result.updatedAt,
		};
	}

	async updateWorkingMemory(params: {
		chatId?: string;
		userId?: string;
		scope: MemoryScope;
		content: string;
	}): Promise<void> {
		const now = new Date();

		const exsiting = await this.db
			.select()
			.from(workingMemory)
			.where(eq(workingMemory.userId, params.userId!))
			.limit(1);

		if (exsiting.length > 0) {
			await this.db
				.update(workingMemory)
				.set({
					content: params.content,
					updatedAt: now,
				})
				.where(eq(workingMemory.userId, params.userId!));
		} else {
			await this.db.insert(workingMemory).values({
				userId: params.userId!,
				content: params.content,
				chatId: params.chatId || null,
				id: params.userId!,
				updatedAt: now,
			});
		}
	}

	async saveMessage(message: ConversationMessage): Promise<void> {
		const content = JSON.parse(message.content as string) as UIChatMessage;

		await this.db.insert(chatMessages).values({
			userId: message.userId,
			content: content,
			role: message.role,
			createdAt: message.timestamp
				? message.timestamp.toISOString()
				: new Date().toISOString(),
			id: content.id!,
			chatId: message.chatId,
		});
	}

	async getMessages<T = UIChatMessage>(params: {
		chatId: string;
		userId?: string;
		limit?: number;
	}): Promise<T[]> {
		const whereConditions: ReturnType<typeof eq>[] = [
			eq(chatMessages.chatId, params.chatId),
		];

		if (params.userId) {
			whereConditions.push(eq(chatMessages.userId, params.userId));
		}

		const results = await this.db
			.select()
			.from(chatMessages)
			.where(and(...whereConditions))
			.orderBy(
				desc(chatMessages.createdAt),
				desc(
					sql`CASE WHEN ${chatMessages.role} = 'assistant' THEN 1 ELSE 0 END`,
				),
			)
			.limit(params.limit || 100);

		return results.map((r) => r.content as T).reverse();
	}

	async saveChat(chat: ChatSession): Promise<void> {
		// Check if chat exists
		const existing = await this.db
			.select()
			.from(chats)
			.where(eq(chats.id, chat.chatId))
			.limit(1);

		if (existing.length > 0) {
			// Update existing - preserve title if new chat doesn't have one
			await this.db
				.update(chats)
				.set({
					userId: chat.userId || null,
					title: chat.title || existing[0].title || null,
					updatedAt: chat.updatedAt.toISOString(),
				})
				.where(eq(chats.id, chat.chatId));
		} else {
			const [user] = await this.db
				.select()
				.from(users)
				.where(eq(users.id, chat.userId!))
				.limit(1);

			if (!user) {
				throw new Error(
					`Cannot save chat for non-existent user ID: ${chat.userId}`,
				);
			}

			// Insert new
			await this.db.insert(chats).values({
				id: chat.chatId,
				userId: chat.userId || null,
				teamId: user.teamId,
				title: chat.title || null,
				createdAt: chat.createdAt.toISOString(),
				updatedAt: chat.updatedAt.toISOString(),
			});
		}
	}

	async getChats(params: {
		userId?: string;
		search?: string;
		limit?: number;
	}): Promise<ChatSession[]> {
		// Build WHERE conditions
		const conditions = [];

		if (params.userId) {
			conditions.push(eq(chats.userId, params.userId));
		}

		if (params.search) {
			// Use LIKE for case-insensitive search
			// For MySQL/SQLite, we'll handle case-insensitivity in the filter
			conditions.push(like(chats.title, `%${params.search}%`));
		}

		const query = this.db.select().from(chats);

		if (conditions.length > 0) {
			const whereCondition =
				conditions.length === 1 ? conditions[0] : and(...conditions);
			query.where(whereCondition);
		}

		// Order by updatedAt descending (most recent first)
		query.orderBy(desc(chats.updatedAt));

		// Apply limit at database level (most efficient)
		if (params.limit) {
			query.limit(params.limit);
		}

		const result = await query;

		const mappedResult = result.map((row: any) => ({
			chatId: row.chatId,
			userId: row.userId || undefined,
			title: row.title || undefined,
			createdAt: new Date(row.createdAt),
			updatedAt: new Date(row.updatedAt),
			messageCount: 0,
		}));

		return mappedResult;
	}

	async getChat(chatId: string): Promise<ChatSession | null> {
		const result = await this.db
			.select()
			.from(chats)
			.where(eq(chats.id, chatId))
			.limit(1);

		if (!result.length) return null;

		const row = result[0];
		return {
			chatId: row.id,
			userId: row.userId || undefined,
			title: row.title || undefined,
			createdAt: new Date(row.createdAt),
			updatedAt: new Date(row.updatedAt),
			messageCount: 0,
		};
	}

	async updateChatTitle(chatId: string, title: string): Promise<void> {
		// Check if chat exists
		const existing = await this.db
			.select()
			.from(chats)
			.where(eq(chats.id, chatId))
			.limit(1);

		if (existing.length > 0) {
			// Chat exists, update it
			await this.db
				.update(chats)
				.set({
					title,
					updatedAt: new Date().toISOString(),
				})
				.where(eq(chats.id, chatId));
		} else {
			// Chat doesn't exist yet, create it with the title
			// This can happen if title generation completes before the chat is saved
			await this.saveChat({
				chatId,
				title,
				createdAt: new Date(),
				updatedAt: new Date(),
				messageCount: 0,
			});
		}
	}

	async deleteChat(chatId: string): Promise<void> {
		// Delete messages first (if messagesTable exists)
		await this.db.delete(chatMessages).where(eq(chatMessages.chatId, chatId));

		// Delete chat (if chatsTable exists)
		await this.db.delete(chats).where(eq(chats.id, chatId));
	}
}
