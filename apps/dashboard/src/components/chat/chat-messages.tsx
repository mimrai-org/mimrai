import type { UIChatMessage } from "@api/ai/types";
import { cn } from "@ui/lib/utils";
import type { UIMessage } from "ai";
import { PaperclipIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useUser } from "@/components/user-provider";
import { useChatStatus } from "@/hooks/use-chat-status";
import { Conversation, ConversationContent } from "../ai-elements/conversation";
import { Message, MessageAvatar, MessageContent } from "../ai-elements/message";
import {
	Reasoning,
	ReasoningContent,
	ReasoningTrigger,
} from "../ai-elements/reasoning";
import { Response } from "../chat/response";
import { FaviconStack } from "../favicon-stack";
import { EmailDraftArtifact } from "./artifacts/email-draft-artifact";
import { TaskArtifact } from "./artifacts/task-artifact";
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

function isVisibleTextPart(part: UIMessage["parts"][number]) {
	return part.type === "text" && !part.text.startsWith("[HIDDEN]");
}

export const Messages = ({ isStreaming }: { isStreaming?: boolean }) => {
	const user = useUser();

	const { messages, status } = useAIChat();
	const { agentStatus, currentToolCall, hasTextContent } = useChatStatus(
		messages,
		status,
	);

	return (
		<Conversation className="h-full w-full">
			<ConversationContent>
				<AnimatePresence>
					{messages.map((message, messageIndex) => {
						const textParts = message.parts.filter(isVisibleTextPart);
						const textContent = textParts
							.map((part) => (part.type === "text" ? part.text : ""))
							.join("\n\n");

						const aiSdkSources = extractAiSdkSources(message.parts);
						const webSearchSources = extractWebSearchSources(message.parts);
						const allSources = [...aiSdkSources, ...webSearchSources];
						const uniqueSources = allSources.filter(
							(source, index, self) =>
								index === self.findIndex((s) => s.url === source.url),
						);

						const isLastMessage = messageIndex === messages.length - 1;
						const isMessageFinished = !isLastMessage || !isStreaming;
						const shouldShowSources =
							uniqueSources.length > 0 &&
							message.role === "assistant" &&
							isMessageFinished;

						const firstVisibleTextPartIndex = message.parts.findIndex((part) =>
							isVisibleTextPart(part),
						);
						const lastReasoningPartIndex = message.parts
							.map((part, index) => ({ part, index }))
							.filter(({ part }) => part.type === "reasoning")
							.at(-1)?.index;

						return (
							<motion.div
								key={message.id || messageIndex}
								className="group mb-4 flex flex-col gap-2 px-1"
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0, y: 10 }}
							>
								{message.parts.map((part, partIndex) => {
									if (part.type === "reasoning") {
										return (
											<Reasoning
												key={`${message.id || messageIndex}-reasoning-${partIndex}`}
												className="w-full"
												isStreaming={
													status === "streaming" &&
													isLastMessage &&
													partIndex === lastReasoningPartIndex
												}
											>
												<ReasoningTrigger />
												<ReasoningContent>{part.text}</ReasoningContent>
											</Reasoning>
										);
									}

									if (part.type === "file") {
										const file = part as {
											type: "file";
											url?: string;
											mediaType?: string;
											filename?: string;
										};
										const fileKey = `${file.url}-${file.filename}-${partIndex}`;
										const isImage = file.mediaType?.startsWith("image/");

										return (
											<Message
												key={`${message.id || messageIndex}-file-${partIndex}`}
												from={message.role}
											>
												<MessageContent className="max-w-[80%]">
													{isImage && file.url ? (
														<div className="relative overflow-hidden rounded-none border">
															<Image
																src={file.url}
																alt={file.filename || "attachment"}
																className="max-h-48 max-w-xs object-cover"
																width={300}
																height={192}
																unoptimized
															/>
														</div>
													) : (
														<div
															key={fileKey}
															className="flex items-center gap-2 rounded-none border bg-muted/50 px-3 py-2"
														>
															<PaperclipIcon className="size-4 shrink-0 text-muted-foreground" />
															<span className="font-medium text-sm">
																{file.filename || "Unknown file"}
															</span>
														</div>
													)}
												</MessageContent>
												{message.role === "user" && user && (
													<MessageAvatar
														src={user.image || ""}
														name={user.name || user.email || ""}
													/>
												)}
											</Message>
										);
									}

									if (part.type === "data-task") {
										return (
											<div
												key={`${message.id || messageIndex}-task-${partIndex}`}
											>
												<TaskArtifact task={part.data} />
											</div>
										);
									}

									if (part.type === "data-email-draft") {
										return (
											<EmailDraftArtifact
												key={`${message.id || messageIndex}-email-draft-${partIndex}`}
												data={part.data}
											/>
										);
									}

									if (isVisibleTextPart(part) && part.type === "text") {
										return (
											<Message
												key={`${message.id || messageIndex}-text-${partIndex}`}
												from={message.role}
											>
												<div
													className={cn("flex flex-1 flex-col gap-2", {
														"items-start": message.role !== "user",
														"items-end": message.role === "user",
													})}
												>
													<div className="flex items-center gap-2 text-sm">
														{message.role === "user" ? (
															<MessageAvatar
																src={user?.image || ""}
																name={user?.name ?? "User"}
																className="size-5"
															/>
														) : null}
													</div>
													{partIndex === firstVisibleTextPartIndex && (
														<MessageContextItems message={message} />
													)}
													<MessageContent variant="contained">
														<Response>{part.text}</Response>
													</MessageContent>
												</div>
											</Message>
										);
									}

									return null;
								})}

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
