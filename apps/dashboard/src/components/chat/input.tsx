"use client";
import { useChatActions, useChatId, useChatStatus } from "@ai-sdk-tools/store";
import { Button } from "@mimir/ui/button";
import {
	PromptInput,
	PromptInputAction,
	PromptInputActions,
	PromptInputTextarea,
} from "@mimir/ui/prompt-input";
import { ArrowUp, Square, StarsIcon } from "lucide-react";
import { useState } from "react";
import { useChatParams } from "@/hooks/use-chat-params";
import type { ChatTitleData } from "./chat-title";

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
		<PromptInput
			value={value}
			onValueChange={setValue}
			onSubmit={handleSubmit}
			className="pointer-events-auto"
		>
			<PromptInputTextarea
			// placeholder={
			// 	<div className="flex items-center gap-1">
			// 		<StarsIcon className="size-3.5" />
			// 		{chatTitle?.title
			// 			? `Continue "${chatTitle.title}"`
			// 			: "Send a message to start the conversation"}
			// 	</div>
			// }
			/>
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
