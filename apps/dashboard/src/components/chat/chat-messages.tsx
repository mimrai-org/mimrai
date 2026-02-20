import type { UIChatMessage } from "@api/ai/types";
import { cn } from "@ui/lib/utils";
import type { UIMessage, UIMessagePart } from "ai";
import {
	CheckIcon,
	CircleCheck,
	PaperclipIcon,
	ToolCaseIcon,
	WrenchIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useUser } from "@/components/user-provider";
import { useChatStatus } from "@/hooks/use-chat-status";
import { useAgents } from "@/hooks/use-data";
import { Conversation, ConversationContent } from "../ai-elements/conversation";
import { Message, MessageAvatar, MessageContent } from "../ai-elements/message";
import {
	Reasoning,
	ReasoningContent,
	ReasoningTrigger,
} from "../ai-elements/reasoning";
import { Response } from "../chat/response";
import { FaviconStack } from "../favicon-stack";
import Loader from "../loader";
import { EmailDraftArtifactMessage } from "./artifacts/email-draft-artifact";
import { TaskArtifactMessage } from "./artifacts/task-artifact";
import { ChatContextList } from "./chat-context/chat-context";
import type { ContextItem } from "./chat-context/store";
import { ChatMessageActions } from "./chat-message-actions";
import { useAIChat } from "./chat-provider";
import { ChatStatusIndicators } from "./chat-status-indicators";

interface SourceItem {
	url: string;
	title: string;
	publishedDate?: string;
}

/**
 * Extract file parts from message
 */
function extractFileParts(parts: UIMessage["parts"]) {
	return parts.filter((part) => part.type === "file");
}

interface WebSearchToolOutput {
	sources?: SourceItem[];
}

/**
 * Extract sources from webSearch tool results
 * Sources are already deduplicated by the tool
 */
function extractWebSearchSources(parts: UIMessage["parts"]): SourceItem[] {
	const sources: SourceItem[] = [];

	for (const part of parts) {
		const type = part.type as string;
		if (type === "tool-webSearch") {
			const output = (part as { output?: WebSearchToolOutput }).output;
			if (output?.sources) {
				sources.push(...output.sources);
			}
		}
	}

	return sources;
}

/**
 * Extract source-url parts from AI SDK
 */
function extractAiSdkSources(parts: UIMessage["parts"]): SourceItem[] {
	const sources: SourceItem[] = [];

	for (const part of parts) {
		if (part.type === "source-url") {
			const sourcePart = part as { url: string; title?: string };
			sources.push({
				url: sourcePart.url,
				title: sourcePart.title || sourcePart.url,
			});
		}
	}

	return sources;
}

export const Messages = ({ isStreaming }: { isStreaming?: boolean }) => {
	const user = useUser();

	const { messages, status } = useAIChat();
	const { agentStatus, currentToolCall, hasTextContent } = useChatStatus(
		messages,
		status,
	);

	const { data: agents } = useAgents();

	return (
		<Conversation className="h-full w-full">
			<ConversationContent>
				<AnimatePresence>
					{messages.map((message, index) => {
						// Extract text parts
						const textParts = message.parts.filter(
							(part) =>
								part.type === "text" && !part.text.startsWith("[HIDDEN]"),
						);
						const textContent = textParts
							.map((part) => (part.type === "text" ? part.text : ""))
							.join("\n\n");

						const reasoningParts = message.parts.filter(
							(part) => part.type === "reasoning",
						);
						const reasoningContent = reasoningParts
							.map((part) => (part.type === "reasoning" ? part.text : ""))
							.join("\n\n");

						// Extract file parts
						const fileParts = extractFileParts(message.parts);

						// Extract sources from AI SDK and webSearch
						const aiSdkSources = extractAiSdkSources(message.parts);

						// Extract sources from webSearch tool results (already deduplicated)
						const webSearchSources = extractWebSearchSources(message.parts);

						// Combine sources and deduplicate between AI SDK and webSearch sources
						const allSources = [...aiSdkSources, ...webSearchSources];
						const uniqueSources = allSources.filter(
							(source, index, self) =>
								index === self.findIndex((s) => s.url === source.url),
						);

						// Check if this is the last (currently streaming) message
						const isLastMessage = index === messages.length - 1;

						// Message is finished if it's not the last message, or if it's the last message and not streaming
						const isMessageFinished = !isLastMessage || !isStreaming;

						// Show sources only after response is finished (not on the currently streaming message)
						const shouldShowSources =
							uniqueSources.length > 0 &&
							message.role === "assistant" &&
							isMessageFinished;

						// Get agent info for tool call status indicators
						const agentId = message.metadata?.agentId;

						const agent = agents?.data.find((agent) => agent.id === agentId);

						return (
							<motion.div
								key={message.id || index}
								className="group mb-4 flex flex-col px-1"
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0, y: 10 }}
							>
								{reasoningParts.length > 0 && (
									<Reasoning
										className="w-full"
										isStreaming={
											status === "streaming" &&
											index === message.parts.length - 1 &&
											message.id === messages.at(-1)?.id
										}
									>
										<ReasoningTrigger />
										<ReasoningContent>{reasoningContent}</ReasoningContent>
									</Reasoning>
								)}

								{/* Render file attachments */}
								{fileParts.length > 0 && (
									<Message from={message.role}>
										<MessageContent className="max-w-[80%]">
											<div className="mb-2 flex flex-wrap gap-2">
												{fileParts.map((part) => {
													if (part.type !== "file") return null;

													const file = part as {
														type: "file";
														url?: string;
														mediaType?: string;
														filename?: string;
													};

													// Create a unique key from file properties
													const fileKey = `${file.url}-${file.filename}`;
													const isImage = file.mediaType?.startsWith("image/");

													if (isImage && file.url) {
														return (
															<div
																key={fileKey}
																className="relative overflow-hidden rounded-none border"
															>
																<Image
																	src={file.url}
																	alt={file.filename || "attachment"}
																	className="max-h-48 max-w-xs object-cover"
																	width={300}
																	height={192}
																	unoptimized
																/>
															</div>
														);
													}

													return (
														<div
															key={fileKey}
															className="flex items-center gap-2 rounded-none border bg-muted/50 px-3 py-2"
														>
															<PaperclipIcon className="size-4 shrink-0 text-muted-foreground" />
															<span className="font-medium text-sm">
																{file.filename || "Unknown file"}
															</span>
														</div>
													);
												})}
											</div>
										</MessageContent>
										{message.role === "user" && user && (
											<MessageAvatar
												src={user.image || ""}
												name={user.name || user.email || ""}
											/>
										)}
									</Message>
								)}

								<TaskArtifactMessage message={message} />
								<EmailDraftArtifactMessage message={message} />

								{/* Render text parts */}
								{textParts.length > 0 && (
									<Message from={message.role}>
										<div
											className={cn("flex flex-1 flex-col gap-2", {
												"items-start": message.role !== "user",
												"items-end": message.role === "user",
											})}
										>
											<MessageContextItems message={message} />
											<MessageContent variant="contained">
												<Response>{textContent}</Response>
											</MessageContent>
										</div>
										{message.role === "user" ? (
											<MessageAvatar
												src={user?.image || ""}
												name={user?.name ?? "User"}
											/>
										) : (
											<MessageAvatar
												src={agent?.avatar || ""}
												name={agent?.name || "Assistant"}
											/>
										)}
									</Message>
								)}

								{/* Render sources as stacked favicons - show immediately when available */}
								{shouldShowSources && (
									<div className="max-w-[80%]">
										<FaviconStack sources={uniqueSources} />
									</div>
								)}

								{message.role === "assistant" &&
									isMessageFinished &&
									textContent && (
										<div className="opacity-0 transition-opacity duration-200 group-hover:opacity-100">
											<div className="flex items-center gap-1">
												{/* Message actions */}
												<ChatMessageActions
													messageContent={textContent}
													messageId={message.id}
												/>
											</div>
										</div>
									)}
							</motion.div>
						);
					})}
					<ChatStatusIndicators
						agentStatus={agentStatus}
						currentToolCall={currentToolCall}
						status={status}
						hasTextContent={hasTextContent}
					/>
				</AnimatePresence>
			</ConversationContent>
		</Conversation>
	);
};

export const MessageContextItems = ({
	message,
}: {
	message: UIChatMessage;
}) => {
	const contextItems = message.metadata?.contextItems;

	if (!contextItems || contextItems.length === 0) {
		return null;
	}

	return (
		<ChatContextList
			disabled={true}
			items={contextItems as ContextItem[]}
			className="px-0"
		/>
	);
};
