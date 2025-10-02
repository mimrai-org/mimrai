import { useChatMessages } from "@ai-sdk-tools/store";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { Markdown } from "../ui/markdown";
import { Message, MessageAvatar, MessageContent } from "../ui/message";
import { useTextStream } from "../ui/response-stream";
import { Response } from "./response";

export const Messages = () => {
	const messages = useChatMessages();

	return messages.map((message, messageIndex) => (
		<div key={message.id} className="mb-4 flex flex-col">
			{message.parts.map((part, index) => {
				const isAssistant = message.role === "assistant";

				switch (part.type) {
					case "text":
						return (
							<Message
								key={`${message.id}-${index}`}
								className={cn("mb-4 text-sm", {
									"self-end": message.role === "user",
									"pt-8": messageIndex === 0,
								})}
							>
								{/* <div className={cn(
											"border p-2 text-sm",
											{
												"self-end": message.role === "user",
											}
										)}> */}
								{isAssistant ? (
									<Response>{part.text}</Response>
								) : (
									<MessageContent>{part.text}</MessageContent>
								)}
								{/* </div> */}
								{message.role === "user" && (
									<MessageAvatar
										src="https://avatars.githubusercontent.com/u/40124537?s=40&v=4"
										alt="Alain00"
										className="size-9"
									/>
								)}
							</Message>
						);

					default:
						return null;
				}
			})}
		</div>
	));
};

export function ResponseStreamWithMarkdown({
	markdownText,
	state,
}: {
	markdownText: string;
	state?: "done" | "streaming";
}) {
	const { displayedText, startStreaming } = useTextStream({
		textStream: markdownText,
		mode: "typewriter",
		speed: 30,
	});

	useEffect(() => {
		startStreaming();
	}, [startStreaming]);

	return (
		<div className="w-full min-w-full">
			<Markdown className="prose prose-sm dark:prose-invert prose-h2:mt-0! prose-h2:scroll-m-0!">
				{state === "streaming" ? displayedText : markdownText}
			</Markdown>
		</div>
	);
}
