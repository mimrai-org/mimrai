"use client";
import { cn } from "@ui/lib/utils";
import { ChatInput } from "./chat-input";
import { Messages } from "./chat-messages";
import { ChatTitle } from "./chat-title";

export const ChatInterface = ({
	showMessages = true,
	showTitle = true,
}: {
	showMessages?: boolean;
	showTitle?: boolean;
}) => {
	return (
		<div className={cn("flex h-full w-full flex-col")}>
			<div className="flex-1 overflow-y-auto">
				{showMessages && <Messages />}
			</div>
			<div className="space-y-1">
				{/* {showTitle && <ChatTitle />} */}
				<ChatInput />
			</div>
		</div>
	);
};
