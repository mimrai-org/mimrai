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
import { useRef, useState } from "react";
import { useChatParams } from "@/hooks/use-chat-params";
import { useDataPart } from "@/hooks/use-data-part";
import { useChatStore } from "@/store/chat";
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
	const { setParams, chatId: chatIdParam } = useChatParams();
	const { setItems } = useChatContext();
	const [value, setValue] = useState("");
	const { status, id: chatId, sendMessage, stop } = useAIChat();
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
		handleInputChange,
		handleKeyDown,
		resetCommandState,
	} = useChatStore();

	const handleSubmit = (message: ChatInputMessage) => {
		const hasText = Boolean(message.text);
		const hasAttachments = Boolean(message.files?.length);

		if (!(hasText || hasAttachments)) {
			return;
		}

		// If currently streaming, stop the current stream first
		if (status === "streaming" || status === "submitted") {
			stop?.();
			// Continue to send the new message after stopping
		}

		if (!chatIdParam) {
			setParams({ chatId });
		}

		sendMessage({
			text: message.text || "Sent with attachments",
			files: message.files,
			metadata: {
				agentId: selectedAgentId,
			},
		});

		setInput("");

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
					<PromptInputTextarea
						ref={textareaRef}
						onChange={handleInputChange}
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
								const form = e.currentTarget.form;
								if (form) {
									form.requestSubmit();
								}
								return;
							}

							// Handle other keys normally
							handleKeyDown(e);
						}}
						value={input}
						placeholder={
							isWebSearch
								? "Search the web"
								: chatTitle?.title
									? `Continue "${chatTitle?.title}" conversation`
									: "Type your message here..."
						}
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
