import { useQuery } from "@tanstack/react-query";
import { Input } from "@ui/components/ui/input";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@ui/components/ui/sidebar";
import { ChevronLeftIcon, MessageCirclePlus, SearchIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { useDebounceValue } from "usehooks-ts";
import { useAgents } from "@/hooks/use-data";
import { useChatStore } from "@/store/chat";
import { trpc } from "@/utils/trpc";
import { AssigneeAvatar } from "../asignee-avatar";
import { useUser } from "../user-provider";

export const ChatSidebar = () => {
	const user = useUser();
	const pathname = usePathname();
	const [search, setSearch] = useState("");
	const [debouncedSearch] = useDebounceValue(search, 300);
	const { selectedAgentId, setSelectedAgentId } = useChatStore();

	const { data: agents } = useAgents();

	const { data: chatHistory } = useQuery(
		trpc.chats.history.queryOptions({
			search: debouncedSearch,
			pageSize: 20,
		}),
	);

	const selectedAgent = useMemo(() => {
		if (!selectedAgentId || !agents?.data) {
			return null;
		}
		return agents.data.find((agent) => agent.id === selectedAgentId) || null;
	}, [selectedAgentId, agents]);

	return (
		<>
			{selectedAgent ? (
				<>
					<SidebarGroup className="mt-1">
						<SidebarGroupContent>
							<SidebarMenu>
								<SidebarMenuItem>
									<SidebarMenuButton
										onClick={() => {
											setSelectedAgentId(null);
										}}
									>
										<ChevronLeftIcon />
										<AssigneeAvatar {...selectedAgent} className="size-5" />
										<span>{selectedAgent.name}</span>
									</SidebarMenuButton>
								</SidebarMenuItem>

								<SidebarMenuItem>
									<Link href={`${user.basePath}/chat`}>
										<SidebarMenuButton>
											<MessageCirclePlus />
											<span>New Chat</span>
										</SidebarMenuButton>
									</Link>
								</SidebarMenuItem>
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
					<SidebarGroup className="flex-1">
						<SidebarGroupContent className="flex flex-1 flex-col">
							<SidebarMenu className="flex-1">
								<SidebarMenuItem className="relative">
									<SearchIcon className="-translate-y-1/2 absolute top-1/2 left-2 size-4 opacity-50" />
									<Input
										placeholder="Search chats..."
										value={search}
										variant="ghost"
										className="ps-8"
										onChange={(e) => setSearch(e.target.value)}
									/>
								</SidebarMenuItem>
								{chatHistory?.map((chat) => {
									const isActive =
										pathname === `${user.basePath}/chat/${chat.id}`;
									return (
										<SidebarMenuItem key={chat.id}>
											<Link href={`${user.basePath}/chat/${chat.id}`}>
												<SidebarMenuButton isActive={isActive}>
													<span>{chat.title}</span>
												</SidebarMenuButton>
											</Link>
										</SidebarMenuItem>
									);
								})}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				</>
			) : (
				<SidebarGroup className="flex-1">
					<SidebarGroupLabel>Chats</SidebarGroupLabel>
					<SidebarGroupContent className="flex flex-1 flex-col">
						<SidebarMenu className="flex-1">
							{agents?.data.map((agent) => (
								<SidebarMenuItem
									key={agent.id}
									onClick={() => setSelectedAgentId(agent.id)}
								>
									<SidebarMenuButton>
										<AssigneeAvatar {...agent} className="size-5" />
										<span>{agent.name}</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			)}
		</>
	);
};
