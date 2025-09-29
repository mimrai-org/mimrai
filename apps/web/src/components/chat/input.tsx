import { useChatStore } from "@ai-sdk-tools/store";
import { ArrowUp, Square } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import {
	PromptInput,
	PromptInputAction,
	PromptInputActions,
	PromptInputTextarea,
} from "../ui/prompt-input";

export const ChatInput = () => {
	const [value, setValue] = useState("");
	const isLoading = useChatStore((state) => state.status === "streaming");
	const sendMessage = useChatStore((state) => state.sendMessage);

	const handleSubmit = () => {
		if (value.trim() === "") return;
		sendMessage({
			text: value.trim(),
		});
	};

	return (
		<PromptInput value={value} onValueChange={setValue}>
			<PromptInputTextarea placeholder="Type your message here..." />
			<PromptInputActions className="flex items-center justify-between gap-2 pt-2">
				<div />
				<PromptInputAction
					tooltip={isLoading ? "Stop generation" : "Send message"}
				>
					<Button
						variant="default"
						size="icon"
						className="size-8"
						onClick={handleSubmit}
					>
						{isLoading ? (
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
