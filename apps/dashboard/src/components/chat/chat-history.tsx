// import { useMutation, useQuery } from "@tanstack/react-query";
// import { Button } from "@ui/components/ui/button";
// import {
// 	ContextMenu,
// 	ContextMenuContent,
// 	ContextMenuItem,
// 	ContextMenuTrigger,
// } from "@ui/components/ui/context-menu";
// import { Input } from "@ui/components/ui/input";
// import { cn } from "@ui/lib/utils";
// import { generateId } from "ai";
// import { format, formatRelative } from "date-fns";
// import { Edit, SearchIcon, TrashIcon } from "lucide-react";
// import { useState } from "react";
// import { toast } from "sonner";
// import { useDebounceValue } from "usehooks-ts";
// import { queryClient, trpc } from "@/utils/trpc";

// export const ChatHistory = () => {
// 	const { show, setChatId } = useChatWidget();
// 	const chatId = useChatWidget((state) => state.chatId);

// 	const [search, setSearch] = useState("");
// 	const [debouncedSearch] = useDebounceValue(search, 300);
// 	const { data: chatHistory } = useQuery(
// 		trpc.chats.history.queryOptions(
// 			{
// 				search: debouncedSearch,
// 				pageSize: 15,
// 			},
// 			{
// 				enabled: show,
// 			},
// 		),
// 	);

// 	const { mutate: deleteChat, isPending: isDeleting } = useMutation(
// 		trpc.chats.delete.mutationOptions({
// 			onMutate: () => {
// 				toast.loading("Deleting chat...", {
// 					id: "delete-chat",
// 				});
// 			},
// 			onSuccess: () => {
// 				toast.success("Chat deleted", {
// 					id: "delete-chat",
// 				});
// 				queryClient.invalidateQueries(trpc.chats.history.queryOptions({}));
// 			},
// 			onError: (error) => {
// 				toast.error(`Error deleting chat: ${error.message}`, {
// 					id: "delete-chat",
// 				});
// 			},
// 		}),
// 	);

// 	const handleSelectChat = (chatId: string) => {
// 		setChatId(chatId);
// 		setSearch("");
// 	};

// 	if (!show) return null;

// 	return (
// 		<div className="w-full space-y-1 px-2 py-12">
// 			<Button
// 				type="button"
// 				variant={"ghost"}
// 				size={"sm"}
// 				className="w-full justify-start text-left"
// 				onClick={() => {
// 					handleSelectChat(generateId());
// 				}}
// 			>
// 				<Edit />
// 				New Chat
// 			</Button>

// 			<div className="relative">
// 				<Input
// 					placeholder="Search chats..."
// 					value={search}
// 					variant={"ghost"}
// 					onChange={(e) => setSearch(e.target.value)}
// 					className="mb-4 h-9 w-full ps-8"
// 				/>
// 				<SearchIcon className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
// 			</div>
// 			{chatHistory?.map((chat) => (
// 				<ContextMenu key={chat.id}>
// 					<ContextMenuTrigger asChild>
// 						<button
// 							type="button"
// 							onClick={() => handleSelectChat(chat.id)}
// 							className={cn(
// 								"w-full rounded-sm px-2 py-1 text-left text-sm hover:bg-accent/60",
// 								{
// 									"bg-accent": chat.id === chatId,
// 								},
// 							)}
// 						>
// 							<div>{chat.title || "Untitled chat"}</div>
// 							<div className="flex justify-start">
// 								<span className="text-muted-foreground text-xs">
// 									{formatRelative(new Date(chat.updatedAt!), new Date())}
// 								</span>
// 							</div>
// 						</button>
// 					</ContextMenuTrigger>
// 					<ContextMenuContent>
// 						<ContextMenuItem
// 							variant="destructive"
// 							disabled={isDeleting}
// 							onSelect={() => {
// 								deleteChat({
// 									chatId: chat.id,
// 								});
// 							}}
// 						>
// 							<TrashIcon />
// 							Delete
// 						</ContextMenuItem>
// 					</ContextMenuContent>
// 				</ContextMenu>
// 			))}
// 		</div>
// 	);
// };
