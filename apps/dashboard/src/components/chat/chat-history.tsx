"use client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "@ui/components/ui/context-menu";
import { Input } from "@ui/components/ui/input";
import { Separator } from "@ui/components/ui/separator";
import { cn } from "@ui/lib/utils";
import {
	ArrowRight,
	ChevronRight,
	MessageCircleHeartIcon,
	MessageCircleIcon,
	PlusIcon,
	SearchIcon,
	TrashIcon,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useDebounceValue } from "usehooks-ts";
import { type Agent, useAgents } from "@/hooks/use-data";
import { useChatStore } from "@/store/chat";
import { queryClient, trpc } from "@/utils/trpc";
import { AssigneeAvatar } from "../asignee-avatar";
import { useUser } from "../user-provider";
import { useAIChat } from "./chat-provider";

export const ChatHistory = () => {
	const user = useUser();
	const { id: chatId } = useAIChat();
	const [search, setSearch] = useState("");
	const [debouncedSearch] = useDebounceValue(search, 300);
	const { selectedAgentId, setSelectedAgentId } = useChatStore();

	const { data: agents } = useAgents();

	const { data: chatHistory } = useQuery(
		trpc.chats.history.queryOptions({
			search: debouncedSearch,
			pageSize: 15,
		}),
	);

	const { mutate: deleteChat, isPending: isDeleting } = useMutation(
		trpc.chats.delete.mutationOptions({
			onMutate: () => {
				toast.loading("Deleting chat...", {
					id: "delete-chat",
				});
			},
			onSuccess: () => {
				toast.success("Chat deleted", {
					id: "delete-chat",
				});
				queryClient.invalidateQueries(trpc.chats.history.queryOptions({}));
			},
			onError: (error) => {
				toast.error(`Error deleting chat: ${error.message}`, {
					id: "delete-chat",
				});
			},
		}),
	);

	const selectedAgent = useMemo(() => {
		if (!selectedAgentId || !agents?.data) {
			return null;
		}
		return agents.data.find((agent) => agent.id === selectedAgentId) || null;
	}, [selectedAgentId, agents]);

	if (!selectedAgent) {
		return (
			<div className="flex flex-col gap-2">
				{agents?.data.map((agent) => (
					<AgentButton
						key={agent.id}
						agent={agent}
						onClick={() => {
							setSelectedAgentId(agent.id);
						}}
					/>
				))}
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-2">
			{selectedAgent && (
				<AgentButton
					agent={selectedAgent}
					onClick={() => {
						setSelectedAgentId(null);
					}}
				/>
			)}
			<Separator />
			<Link href={`${user.basePath}/chat`}>
				<Button
					type="button"
					variant={"default"}
					className="h-8 w-full justify-start text-left"
				>
					<PlusIcon />
					New Chat
				</Button>
			</Link>

			<div className="relative">
				<Input
					placeholder="Search chats..."
					value={search}
					variant={"ghost"}
					onChange={(e) => setSearch(e.target.value)}
					className="h-9 w-full ps-8"
				/>
				<SearchIcon className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
			</div>
			<Separator />
			<div className="flex flex-col gap-1">
				{chatHistory?.map((chat) => (
					<ContextMenu key={chat.id}>
						<ContextMenuTrigger asChild>
							<Link href={`${user.basePath}/chat/${chat.id}`}>
								<button
									type="button"
									className={cn(
										"h-8 w-full rounded-sm px-2 text-left text-muted-foreground text-sm transition-colors hover:bg-accent/30 hover:text-foreground",
										{
											"bg-accent text-foreground": chat.id === chatId,
										},
									)}
								>
									<div className="truncate">
										{chat.title || "Untitled chat"}
									</div>
								</button>
							</Link>
						</ContextMenuTrigger>
						<ContextMenuContent>
							<ContextMenuItem
								variant="destructive"
								disabled={isDeleting}
								onSelect={() => {
									deleteChat({
										chatId: chat.id,
									});
								}}
							>
								<TrashIcon />
								Delete
							</ContextMenuItem>
						</ContextMenuContent>
					</ContextMenu>
				))}
			</div>
		</div>
	);
};

const AgentButton = ({
	agent,
	onClick,
	className,
}: {
	agent: Agent;
	className?: string;
	onClick: () => void;
}) => {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"flex flex-col gap-2 rounded-sm px-2 py-1 text-sm hover:bg-accent dark:hover:bg-accent/30",
				className,
			)}
		>
			<div className="flex items-center gap-2 text-start">
				<AssigneeAvatar {...agent} className="size-5" />
				<div className="flex-1">
					<div className="font-medium">{agent.name}</div>
					<div className="text-muted-foreground">{agent.description}</div>
				</div>
			</div>
		</button>
	);
};
