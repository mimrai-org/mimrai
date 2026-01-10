"use client";
import { useChat } from "@ai-sdk-tools/store";
import type { UIChatMessage } from "@api/ai/types";
import { cn } from "@ui/lib/utils";
import { DefaultChatTransport, generateId } from "ai";
import { useMemo } from "react";
import { ChatHistory } from "./chat-history";
import { ChatInput, type ChatInputMessage } from "./chat-input";
import { Messages } from "./chat-messages";
import { ChatTitle } from "./chat-title";
import { useChatWidget } from "./chat-widget";

export const ChatInterface = ({
	id,
	showMessages = true,
}: {
	id?: string;
	showMessages?: boolean;
}) => {
	// const { chatId: chatIdParam } = useChatParams();
	const { setChatId, chatId: chatIdParam, show } = useChatWidget();

	// Use provided id, or get from route, or generate new one
	const providedId = id ?? chatIdParam;

	// Generate a consistent chat ID - use provided ID or generate one
	const chatId = useMemo(() => {
		if (providedId) return providedId;
		const newId = generateId();
		setChatId(newId);
		return newId;
	}, [providedId]);

	const authenticatedFetch = useMemo(
		() =>
			Object.assign(
				async (url: RequestInfo | URL, requestOptions?: RequestInit) => {
					return fetch(url, {
						...requestOptions,
						headers: {
							...requestOptions?.headers,
							"Content-Type": "application/json",
						},
						credentials: "include",
					});
				},
			),
		[],
	);

	useChat<UIChatMessage>({
		id: chatId,
		transport: new DefaultChatTransport({
			api: `${process.env.NEXT_PUBLIC_SERVER_URL}/api/chat`,
			fetch: authenticatedFetch,
			prepareSendMessagesRequest({ messages, id }) {
				const lastMessage = messages[messages.length - 1] as ChatInputMessage;

				const agentChoice = lastMessage.metadata?.agentChoice;
				const toolChoice = lastMessage.metadata?.toolChoice;
				const contextItems = lastMessage.metadata?.contextItems || [];

				return {
					body: {
						id,
						message: lastMessage,
						contextItems,
						agentChoice,
						toolChoice,
						timezone: new Intl.DateTimeFormat().resolvedOptions().timeZone,
					},
				};
			},
		}),
	});

	return (
		<div className="grid h-full grid-cols-[256px_1fr]">
			<div
				className={cn("h-full overflow-y-auto bg-sidebar", {
					"opacity-0": !showMessages,
				})}
			>
				<ChatHistory />
			</div>
			<div
				className={cn(
					"flex w-3xl flex-col justify-self-center overflow-hidden p-4 transition-all",
				)}
			>
				{showMessages ? (
					<Messages />
				) : (
					<div className="pointer-events-none h-full" />
				)}
				<div>
					{show && (
						<div className="flex items-end justify-between space-x-4 py-2">
							<ChatTitle />
						</div>
					)}
					<ChatInput />
				</div>
			</div>
		</div>
	);
};
