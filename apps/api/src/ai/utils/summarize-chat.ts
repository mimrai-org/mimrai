import { openai } from "@ai-sdk/openai";
import { db } from "@mimir/db/client";
import { chatMessages, chats } from "@mimir/db/schema";
import { generateText } from "ai";
import { and, eq, gt } from "drizzle-orm";

export const summarizeChat = async ({
	chatId,
	lastSummaryAt,
	lastSummary,
}: {
	chatId: string;
	lastSummaryAt: string;
	lastSummary?: string;
}) => {
	const newMessages = await db
		.select()
		.from(chatMessages)
		.where(
			and(
				gt(chatMessages.createdAt, new Date(lastSummaryAt).toISOString()),
				eq(chatMessages.chatId, chatId),
			),
		);

	const shouldSummarize = newMessages.length > 20;
	if (!shouldSummarize) {
		return lastSummary || "";
	}

	const textParts: string[] = [];
	for (const message of newMessages) {
		for (const part of message.content.parts) {
			if (part.type === "text") {
				textParts.push(`${message.content.role}: ${part.text}`);
			}
		}
	}

	const fullText = textParts.join("\n");

	const summary = await generateText({
		model: openai("gpt-4o-mini"),
		prompt: `Summarize the following conversation between a user and an AI assistant. This summary will be used to provide context for future interactions, so focus on key points, decisions, and important information shared.

Last known summary:
${lastSummary || "No previous summary."}

New conversation messages:
${fullText}
`,
	});

	const summaryText = summary.text.trim();

	// Update chat with new summary and timestamp
	await db
		.update(chats)
		.set({
			summary: summaryText,
			lastSummaryAt: new Date().toISOString(),
		})
		.where(eq(chats.id, chatId));

	return summaryText;
};
