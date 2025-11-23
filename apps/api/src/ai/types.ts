import type { UIMessage } from "ai";
import type { MessageDataParts } from "./tools/registry";
import type { ContextItem } from "./utils/format-context-items";

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
	contextItems?: ContextItem[];
};

// Define the UI chat message type with proper metadata and tool typing
export type UIChatMessage = UIMessage<
	ChatMessageMetadata,
	MessageDataParts,
	UITools
>;
