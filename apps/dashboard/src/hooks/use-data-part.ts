"use client";

import { useMemo } from "react";
import { useAIChat } from "@/components/chat/chat-provider";

/**
 * Hook to extract data parts from the latest assistant message
 * @param type The type of data part to extract
 * @returns The data part value or undefined if not found
 */
export function useDataPart<T = unknown>(type: string): [T | undefined] {
	const { messages } = useAIChat();

	const dataPart = useMemo(() => {
		if (messages.length === 0) return undefined;

		const lastMessage = messages[messages.length - 1];
		if (lastMessage?.role !== "assistant") return undefined;

		// Look for data parts in the message
		const dataParts = lastMessage.parts?.filter(
			(part) => part.type === "data" && (part as any).data?.type === type,
		);

		if (dataParts && dataParts.length > 0) {
			return (dataParts[0] as any).data?.data as T;
		}

		return undefined;
	}, [messages, type]);

	return [dataPart];
}
