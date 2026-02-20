"use client";
import { useChat } from "@ai-sdk/react";
import type { UIChatMessage } from "@api/ai/types";
import { DefaultChatTransport } from "ai";
import { createContext, useContext, useEffect, useMemo, useRef } from "react";
import { useAgentToolCacheInvalidation } from "@/hooks/use-agent-tool-cache-invalidation";
import { getSelectedAgentCookieKeyClient, useChatStore } from "@/store/chat";
import { useUser } from "../user-provider";
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
	initialSelectedAgentId?: string;
	title?: string;
	id: string;
}

export const ChatProvider = ({
	children,
	initialMessages = [],
	initialSelectedAgentId,
	title,
	id,
}: ChatProviderProps) => {
	const user = useUser();
	const setSelectedAgentId = useChatStore((state) => state.setSelectedAgentId);
	const selectedAgentId = useChatStore((state) => state.selectedAgentId);
	const hasAttemptedResumeRef = useRef(false);

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

	useEffect(() => {
		if (initialSelectedAgentId) {
			setSelectedAgentId(initialSelectedAgentId);
		}
	}, [initialSelectedAgentId, setSelectedAgentId]);

	useEffect(() => {
		// biome-ignore lint/suspicious/noDocumentCookie: not suspicious in this case
		document.cookie = `${getSelectedAgentCookieKeyClient(user.team.id)}=${selectedAgentId || ""}; path=/; max-age=31536000`;
	}, [selectedAgentId, user.team.id]);

	const chat = useChat({
		id,
		messages: initialMessages,
		transport: new DefaultChatTransport({
			api: `${process.env.NEXT_PUBLIC_SERVER_URL}/api/chat`,
			fetch: authenticatedFetch,
			prepareSendMessagesRequest({ messages, id }) {
				const lastMessage = messages[messages.length - 1] as ChatInputMessage;

				const agentId = lastMessage.metadata?.agentId;
				const agentChoice = lastMessage.metadata?.agentChoice;
				const toolChoice = lastMessage.metadata?.toolChoice;
				const contextItems = lastMessage.metadata?.contextItems || [];

				return {
					body: {
						id,
						message: lastMessage,
						contextItems,
						agentId,
						agentChoice,
						toolChoice,
						timezone: new Intl.DateTimeFormat().resolvedOptions().timeZone,
					},
				};
			},
			prepareReconnectToStreamRequest({ id }) {
				return {
					api: `${process.env.NEXT_PUBLIC_SERVER_URL}/api/chat/${id}/stream`,
					credentials: "include",
				};
			},
		}),
	});

	useAgentToolCacheInvalidation(chat.messages);

	useEffect(() => {
		if (hasAttemptedResumeRef.current) {
			return;
		}
		hasAttemptedResumeRef.current = true;
		chat.resumeStream().catch((error) => {
			console.error("Failed to resume chat stream:", error);
		});
	}, [chat]);

	const merge = useMemo(() => {
		return {
			...chat,
			title,
		};
	}, [chat, title]);

	return <ChatContext.Provider value={merge}>{children}</ChatContext.Provider>;
};
