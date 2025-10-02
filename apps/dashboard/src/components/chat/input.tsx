"use client";
import {
	useChatActions,
	useChatId,
	useChatStatus,
	useChatStore,
} from "@ai-sdk-tools/store";
import { ArrowUp, Square } from "lucide-react";
import { useState } from "react";
import { useChatParams } from "@/hooks/use-chat-params";
import { TeamSwitcher } from "../team-switcher";
import { Button } from "../ui/button";
import {
	PromptInput,
	PromptInputAction,
	PromptInputActions,
	PromptInputTextarea,
} from "../ui/prompt-input";

export const ChatInput = () => {
	const { setParams, chatId: chatIdParam } = useChatParams();
	const [value, setValue] = useState("");
	const status = useChatStatus();
	const chatId = useChatId();
	const { sendMessage } = useChatActions();

	const handleSubmit = () => {
		if (value.trim() === "") return;
		sendMessage({
			text: value.trim(),
		});
		setValue("");

		// If there's no chatId in the URL, set it
		if (!chatIdParam) setParams({ chatId });
	};

	return (
		<PromptInput value={value} onValueChange={setValue} onSubmit={handleSubmit}>
			<PromptInputTextarea placeholder="Type your message here..." />
			<PromptInputActions className="flex items-center justify-between gap-2 pt-2">
				<div />
				<PromptInputAction
					tooltip={status === "streaming" ? "Stop generation" : "Send message"}
				>
					<Button
						variant="default"
						size="icon"
						className="size-8"
						onClick={handleSubmit}
					>
						{status === "streaming" ? (
							<Square className="size-5 fill-current" />
						) : (
							<ArrowUp className="size-5" />
						)}
					</Button>
				</PromptInputAction>
			</PromptInputActions>
		</PromptInput>
	);
};
