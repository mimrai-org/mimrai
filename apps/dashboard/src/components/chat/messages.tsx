import { useChatMessages } from "@ai-sdk-tools/store";
import type { UIChatMessage } from "@mimir/server/ai/types";
import { Fragment } from "react";
import { Conversation, ConversationContent } from "../ai-elements/conversation";
import { Message, MessageAvatar, MessageContent } from "../ai-elements/message";
import { Response } from "../ai-elements/response";

export const Messages = () => {
	const messages = useChatMessages<UIChatMessage>();

	return (
		<Conversation className="h-full w-full">
			<ConversationContent>
				{messages.map((message) => (
					<div key={message.id} className="mb-4 flex flex-col">
						{message.parts.map((part, index) => {
							switch (part.type) {
								case "text":
									return (
										<Message from={message.role} key={`${message.id}-${index}`}>
											<MessageContent>
												<Response>{part.text}</Response>
											</MessageContent>
											{message.role === "user" && (
												<MessageAvatar
													src="https://avatars.githubusercontent.com/u/40124537?s=40&v=4"
													className="size-9"
												/>
											)}
										</Message>
									);

								default: {
									if (part.type.startsWith("tool-")) {
										console.log("Rendering tool part:", part);
										return (
											<Fragment key={`${message.id}-${index}`}>
												<Message from={message.role}>
													<MessageContent>
														<Response>{(part as any)?.output?.text}</Response>
													</MessageContent>
												</Message>
											</Fragment>
										);
									}
									return null;
								}
							}
						})}
					</div>
				))}
			</ConversationContent>
		</Conversation>
	);
};
