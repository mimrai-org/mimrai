import type { UIMessage } from "ai";
import type { MessageDataParts } from "./tools/registry";

// Define UITools as a generic type to avoid circular dependencies
// This will be properly typed when used with the actual tool registry
export type UITools = Record<string, any>;

// Define message metadata type
export type ChatMessageMetadata = {
	webSearch?: boolean;
	toolCall?: {
		toolName: string;
		toolParams: Record<string, any>;
	};
};

// Define the UI chat message type with proper metadata and tool typing
export type UIChatMessage = UIMessage<
	ChatMessageMetadata,
	MessageDataParts,
	UITools
>;
