import { useChatMessages } from "@ai-sdk-tools/store";
import type { UIChatMessage } from "@mimir/api/ai/types";
import { ToolCaseIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Fragment } from "react";
import { useUser } from "@/hooks/use-user";
import { Conversation, ConversationContent } from "../ai-elements/conversation";
import { Message, MessageAvatar, MessageContent } from "../ai-elements/message";
import { Response } from "../ai-elements/response";

export const Messages = () => {
	const user = useUser();
	const messages = useChatMessages<UIChatMessage>();

	return (
		<Conversation className="h-full w-full">
			<ConversationContent>
				<AnimatePresence>
					{messages.map((message) => (
						<motion.div
							key={message.id}
							className="mb-4 flex flex-col px-1"
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0, y: 10 }}
						>
							{message.parts.map((part, index) => {
								switch (part.type) {
									case "text":
										return (
											<Message
												from={message.role}
												key={`${message.id}-${index}`}
											>
												<MessageContent>
													<Response>{part.text}</Response>
												</MessageContent>
												{message.role === "user" && (
													<MessageAvatar
														src={""}
														name={user?.name ?? "User"}
														className="size-8"
													/>
												)}
											</Message>
										);

									default: {
										if (part.type.startsWith("tool-")) {
											return (
												<Fragment key={`${message.id}-${index}`}>
													<Message from={message.role}>
														<div className="flex items-start gap-2 text-muted-foreground text-sm italic">
															<ToolCaseIcon className="size-4" />
															<Response>{(part as any)?.output?.text}</Response>
														</div>
													</Message>
												</Fragment>
											);
										}
										return null;
									}
								}
							})}
						</motion.div>
					))}
				</AnimatePresence>
			</ConversationContent>
		</Conversation>
	);
};
