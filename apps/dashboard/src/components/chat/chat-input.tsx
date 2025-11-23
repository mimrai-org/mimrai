"use client";
import {
	useChatActions,
	useChatId,
	useChatStatus,
	useDataPart,
} from "@ai-sdk-tools/store";
import { Button } from "@mimir/ui/button";
import {
	PromptInput,
	PromptInputActionAddAttachments,
	PromptInputAttachment,
	PromptInputAttachments,
	PromptInputBody,
	// PromptInputAction,
	// PromptInputActions,
	type PromptInputMessage,
	PromptInputSubmit,
	PromptInputTextarea,
	PromptInputToolbar,
	PromptInputTools,
} from "@mimir/ui/prompt-input-new";
import type { Editor as EditorType } from "@tiptap/react";
import { ArrowUp, Square, StarsIcon } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useChatParams } from "@/hooks/use-chat-params";
import { useChatStore } from "@/store/chat";
import { Editor } from "../editor";
import { ChatContextList } from "./chat-context/chat-context";
// import { suggestionsOptions } from "../editor/extentions/suggestions";
import { type ContextItem, useChatContext } from "./chat-context/store";
import type { ChatTitleData } from "./chat-title";
import { useChatWidget } from "./chat-widget";
import { RecordButton } from "./record-button";
import { WebSearchButton } from "./web-search-button";

export interface ChatInputMessage extends PromptInputMessage {
	metadata?: {
		agentChoice?: string;
		toolChoice?: string;
		contextItems?: ContextItem[];
	};
}

export const ChatInput = () => {
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const { setHover, toggle } = useChatWidget();
	const { setParams, chatId: chatIdParam } = useChatParams();
	const { setItems } = useChatContext();
	const [value, setValue] = useState("");
	const status = useChatStatus();
	const chatId = useChatId();
	const { items } = useChatContext();
	const { sendMessage, stop } = useChatActions();
	const [data] = useDataPart<ChatTitleData>("chat-title");
	const chatTitle = data as ChatTitleData;

	const {
		input,
		isWebSearch,
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

		console.log("Sending message with context items:", message.files);

		sendMessage({
			text: message.text || "Sent with attachments",
			files: message.files,
			metadata: {
				contextItems: items,
				agentChoice: message.metadata?.agentChoice,
				toolChoice: message.metadata?.toolChoice,
			},
		});

		setInput("");

		// Clear context items after sending
		setItems([]);
	};

	const contextPlaceholder = useMemo<string>(() => {
		if (items.length === 0) return "";
		return `Ask anything about ${items
			.map((item) => `"${item.label}"`)
			.join(", ")}`;
	}, [items]);

	return (
		<div
			onMouseEnter={() => {
				setHover(true);
			}}
			onMouseLeave={() => {
				setHover(false);
			}}
			onClick={() => {
				toggle(true);
			}}
		>
			<PromptInput
				onSubmit={handleSubmit}
				globalDrop
				multiple
				className="pointer-events-auto"
			>
				<PromptInputBody>
					<ChatContextList disabled={false} items={items} className="pt-3" />
					<PromptInputAttachments>
						{(attachment) => <PromptInputAttachment data={attachment} />}
					</PromptInputAttachments>
					<PromptInputTextarea
						ref={textareaRef}
						autoFocus
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
								: contextPlaceholder ||
									`Continue "${chatTitle?.title}" conversation` ||
									"Ask anything"
						}
					/>
				</PromptInputBody>
				<PromptInputToolbar>
					<PromptInputTools>
						<PromptInputActionAddAttachments />
						<WebSearchButton />
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
