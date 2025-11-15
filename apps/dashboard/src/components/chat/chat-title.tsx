import { useDataPart } from "@ai-sdk-tools/store";
import { useQuery } from "@tanstack/react-query";
import {
	Command,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandSeparator,
} from "@ui/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@ui/components/ui/popover";
import { generateId } from "ai";
import { ChevronDown, ChevronUp, PlusIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useDebounceValue } from "usehooks-ts";
import { queryClient, trpc } from "@/utils/trpc";
import { useChatWidget } from "./chat-widget";

export interface ChatTitleData {
	chatId: string;
	title: string;
}

export const ChatTitle = () => {
	const { show, setChatId } = useChatWidget();
	const [search, setSearch] = useState("");
	const [debouncedSearch] = useDebounceValue(search, 300);
	const [chatTitle] = useDataPart<ChatTitleData>("chat-title", {
		onData: (dataPart) => {
			if (dataPart.data.title) {
				queryClient.invalidateQueries(
					trpc.chats.history.queryOptions({
						search: debouncedSearch,
					}),
				);
			}
		},
	});

	const { data: chatHistory } = useQuery(
		trpc.chats.history.queryOptions(
			{
				search: debouncedSearch,
			},
			{
				enabled: show,
			},
		),
	);

	const handleSelectChat = (chatId: string) => {
		setChatId(chatId);
		setSearch("");
	};

	return (
		<AnimatePresence>
			{show && (
				<motion.div
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -10 }}
					transition={{ duration: 0.2 }}
					className="min-w-32"
				>
					<Popover>
						<PopoverTrigger>
							<div className="flex items-center gap-2 text-foreground text-xs">
								<ChevronDown className="size-3" />
								<div>{chatTitle?.title ?? "New conversation"}</div>
							</div>
						</PopoverTrigger>
						<PopoverContent>
							<Command shouldFilter={false}>
								{chatHistory && chatHistory?.length > 6 && (
									<CommandInput value={search} onValueChange={setSearch} />
								)}

								<CommandGroup heading="Chats">
									{chatHistory?.map((chat, index) => (
										<CommandItem
											key={chat.chatId}
											onSelect={() => handleSelectChat(chat.chatId)}
										>
											<div className="sr-only">Select chat {index + 1}</div>
											{chat.title ?? "Untitled"}
										</CommandItem>
									))}
								</CommandGroup>
								<CommandSeparator />
								<CommandGroup>
									<CommandItem onSelect={() => handleSelectChat(generateId())}>
										<PlusIcon className="size-4" />
										New Conversation
									</CommandItem>
								</CommandGroup>
							</Command>
						</PopoverContent>
					</Popover>
				</motion.div>
			)}
		</AnimatePresence>
	);
};
