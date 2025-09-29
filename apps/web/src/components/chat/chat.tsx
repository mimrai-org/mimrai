"use client";
import { useChat } from "@ai-sdk-tools/store";
import { DefaultChatTransport } from "ai";
import { ChatInput } from "./input";

export const Chat = () => {
	useChat({
		transport: new DefaultChatTransport({
			api: "/api/chat",
		}),
	});

	return (
		<div className="-translate-x-1/2 fixed bottom-8 left-1/2 w-full max-w-3xl px-4">
			<ChatInput />
		</div>
	);
};
