"use client";
import {
	PromptInput,
	PromptInputActionAddAttachments,
	PromptInputAttachment,
	PromptInputAttachments,
	PromptInputBody,
	type PromptInputMessage,
	PromptInputSubmit,
	PromptInputTextarea,
	PromptInputToolbar,
	PromptInputTools,
} from "@mimir/ui/prompt-input-new";
import type { Editor as EditorInstance } from "@tiptap/react";
import { useRef } from "react";
import { useChatParams } from "@/hooks/use-chat-params";
import { useDataPart } from "@/hooks/use-data-part";
import { useChatStore } from "@/store/chat";
import { Editor } from "../editor";
import { AgentSelectorButton } from "./agent-selector-button";
import { type ContextItem, useChatContext } from "./chat-context/store";
import { useAIChat } from "./chat-provider";
import type { ChatTitleData } from "./chat-title";
import { RecordButton } from "./record-button";
import { WebSearchButton } from "./web-search-button";

export interface ChatInputMessage extends PromptInputMessage {
	metadata?: {
		agentId?: string | null;
		agentChoice?: string;
		toolChoice?: string;
		contextItems?: ContextItem[];
	};
}

export const ChatInput = () => {
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const editorRef = useRef<EditorInstance>(null);
	const { setParams, chatId: chatIdParam } = useChatParams();
	const { setItems } = useChatContext();
	const { status, id: chatId, sendMessage } = useAIChat();
	const [data] = useDataPart<ChatTitleData>("chat-title");
	const chatTitle = data;

	const {
		input,
		isWebSearch,
		selectedAgentId,
		isUploading,
		isRecording,
		isProcessing,
		showCommands,
		setInput,
	} = useChatStore();

	const handleSubmit = (message: ChatInputMessage) => {
		const cleanText = message.text?.replace(/&nbsp;/g, "").trim();
		const hasText = Boolean(cleanText);
		const hasAttachments = Boolean(message.files?.length);

		if (!(hasText || hasAttachments)) {
			return;
		}

		if (status === "streaming" || status === "submitted") {
			return;
		}

		if (!chatIdParam) {
			setParams({ chatId });
		}

		sendMessage({
			text: cleanText || "Sent with attachments",
			files: message.files,
			metadata: {
				agentId: selectedAgentId,
			},
		});

		setInput("");
		editorRef.current?.commands.clearContent();

		// Clear context items after sending
		setItems([]);
	};

	return (
		<div>
			<PromptInput
				onSubmit={handleSubmit}
				globalDrop
				multiple
				className="pointer-events-auto"
			>
				<PromptInputBody>
					<PromptInputAttachments>
						{(attachment) => <PromptInputAttachment data={attachment} />}
					</PromptInputAttachments>
					<Editor
						ref={editorRef}
						value={input}
						autoFocus
						onChange={(value) => {
							setInput(value);
						}}
						onKeyDown={(e) => {
							// Handle Enter key for commands
							if (e.key === "Enter" && showCommands) {
								e.preventDefault();
								return;
							}

							// Handle Enter key for normal messages - trigger form submission
							if (e.key === "Enter" && !showCommands && !e.shiftKey) {
								// Don't submit if IME composition is in progress
								if (e.nativeEvent.isComposing) {
									return;
								}

								e.preventDefault();
								const form = e.currentTarget.closest("form");
								if (form) {
									form.requestSubmit();
								}
								return;
							}

							// Handle other keys normally
							// handleKeyDown(e);
						}}
						placeholder={
							isWebSearch
								? "Search the web"
								: chatTitle?.title
									? `Continue "${chatTitle?.title}" conversation`
									: "Type your message here..."
						}
						className="p-4 [&_.tiptap]:min-h-[40px] [&_.tiptap]:text-sm!"
					/>
					<PromptInputTextarea
						ref={textareaRef}
						value={input}
						className="invisible size-0! min-h-0 min-w-0 p-0 opacity-0"
					/>
				</PromptInputBody>
				<PromptInputToolbar>
					<PromptInputTools>
						<PromptInputActionAddAttachments />
						<WebSearchButton />
						<AgentSelectorButton />
					</PromptInputTools>

					<PromptInputTools>
						<RecordButton size={16} />
						<PromptInputSubmit
							disabled={
								(!input && !status) ||
								isUploading ||
								isRecording ||
								isProcessing
							}
							status={status}
						/>
					</PromptInputTools>
				</PromptInputToolbar>
			</PromptInput>
		</div>
	);
};
