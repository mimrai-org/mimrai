import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import type { UIChatMessage } from "../types";

const UNTITLED_CHAT = "Untitled chat";
const MIN_LENGTH_FOR_TITLE = 20;

export const generateTitle = async ({
	messages,
	currentTitle,
}: {
	messages: UIChatMessage[];
	currentTitle?: string;
}) => {
	if (currentTitle && currentTitle !== UNTITLED_CHAT) {
		return false;
	}

	const sliceMessages = messages.slice(-3);
	const textParts: string[] = [];
	for (const message of sliceMessages) {
		for (const part of message.parts) {
			if (part.type === "text") {
				textParts.push(`${message.role}: ${part.text}`);
			}
		}
	}

	const fullText = textParts.join("\n");

	const shouldGenerateTitle = fullText.length > MIN_LENGTH_FOR_TITLE;
	if (!shouldGenerateTitle) {
		return UNTITLED_CHAT;
	}

	const titleResponse = await generateText({
		model: openai("gpt-4o-mini"),
		prompt: `Generate a concise and descriptive title for the following conversation between a user and an AI assistant. 
The title should capture the main topic or purpose of the conversation in 3 to 5 words. 
Return only the title without any additional text or formatting.

Conversation:
${fullText}`,
	});
	return titleResponse.text.trim();
};
