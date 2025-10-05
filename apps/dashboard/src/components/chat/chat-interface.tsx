"use client";
import { AIDevtools } from "@ai-sdk-tools/devtools";
import { useChat } from "@ai-sdk-tools/store";
import type { UIChatMessage } from "@mimir/api/ai/types";
import { DefaultChatTransport, generateId } from "ai";
import { useMemo } from "react";
import { useChatParams } from "@/hooks/use-chat-params";
import { queryClient, trpc } from "@/utils/trpc";
import { ChatContainerContent, ChatContainerRoot } from "../ui/chat-container";
import { ChatInput } from "./input";
import { Messages } from "./messages";

export const ChatInterface = ({ id }: { id?: string }) => {
	const { chatId: chatIdParam } = useChatParams();

	// Use provided id, or get from route, or generate new one
	const providedId = id ?? chatIdParam;

	// Generate a consistent chat ID - use provided ID or generate one
	const chatId = useMemo(() => providedId ?? generateId(), [providedId]);

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
		enableBatching: true,
		experimental_throttle: 50,
		transport: new DefaultChatTransport({
			api: `${process.env.NEXT_PUBLIC_SERVER_URL}/api/chat`,
			fetch: authenticatedFetch,
			prepareSendMessagesRequest({ messages }) {
				return {
					body: {
						id: chatId,
						message: messages[messages.length - 1],
						timezone: new Intl.DateTimeFormat().resolvedOptions().timeZone,
					},
				};
			},
		}),
		onFinish: async (data) => {
			// Check if was a tool call
			const hasToolCall = data.message.parts.some((part) =>
				part.type.includes("tool"),
			);

			if (hasToolCall) {
				// Refetch the chat to get the updated message with tool results
				await queryClient.invalidateQueries(trpc.tasks.get.queryOptions());
			}
		},
	});

	return (
		<div className="h-full">
			<div className="flex h-[calc(100vh-120px)] w-full flex-col overflow-hidden px-4">
				<Messages />
				<ChatInput />
			</div>
			{process.env.NODE_ENV === "development" && (
				<AIDevtools
					config={{
						streamCapture: {
							enabled: true,
							endpoint: `${process.env.NEXT_PUBLIC_SERVER_URL}/api/chat`,
							autoConnect: true,
						},
					}}
				/>
			)}
		</div>
	);
};
