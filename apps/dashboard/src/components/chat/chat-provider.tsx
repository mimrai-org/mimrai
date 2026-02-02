"use client";
import { useChat } from "@ai-sdk/react";
import type { UIChatMessage } from "@api/ai/types";
import { DefaultChatTransport } from "ai";
import { createContext, useContext, useMemo } from "react";
import type { ChatInputMessage } from "./chat-input";

interface ChatContextValue extends ReturnType<typeof useChat<UIChatMessage>> {
	title?: string;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export const useAIChat = () => {
	const context = useContext(ChatContext);
	if (!context) {
		throw new Error("useAIChat must be used within ChatProvider");
	}
	return context;
};

interface ChatProviderProps {
	children: React.ReactNode;
	initialMessages?: UIChatMessage[];
	title?: string;
	id: string;
}

export const ChatProvider = ({
	children,
	initialMessages = [],
	title,
	id,
}: ChatProviderProps) => {
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

	const chat = useChat({
		id,
		messages: initialMessages,
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

	const merge = useMemo(() => {
		return {
			...chat,
			title,
		};
	}, [chat, title]);

	return <ChatContext.Provider value={merge}>{children}</ChatContext.Provider>;
};
