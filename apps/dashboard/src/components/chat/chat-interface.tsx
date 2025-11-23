"use client";
import { useChat } from "@ai-sdk-tools/store";
import type { UIChatMessage } from "@mimir/api/ai/types";
import { DefaultChatTransport, generateId } from "ai";
import { useMemo } from "react";
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
		<div className="h-full">
			<div className="flex h-full w-full flex-col overflow-hidden">
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
