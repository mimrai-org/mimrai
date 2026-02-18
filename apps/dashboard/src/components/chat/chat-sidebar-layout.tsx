"use client";

import {
	Sidebar,
	SidebarContent,
	SidebarProvider,
} from "@ui/components/ui/sidebar";
import { BotIcon } from "lucide-react";
import { useChatStore } from "@/store/chat";
import { ChatAgentSidebar } from "./chat-agent-sidebar";
import { ChatSidebar } from "./chat-sidebar";

export function ChatSidebarLayout({ children }: { children: React.ReactNode }) {
	const selectedAgentId = useChatStore((state) => state.selectedAgentId);

	return (
		<SidebarProvider
			defaultOpen={true}
			className="max-h-[calc(100vh-48px)] min-h-[calc(100vh-48px)]"
			style={
				{
					"--sidebar-width": "240px",
				} as React.CSSProperties
			}
		>
			<Sidebar collapsible="none" className="border-r bg-transparent">
				<SidebarContent>
					<ChatSidebar />
				</SidebarContent>
			</Sidebar>
			{selectedAgentId ? (
				<>
					<div className="flex-1 overflow-y-auto">{children}</div>
					<Sidebar collapsible="none" className="border-l">
						<SidebarContent>
							<ChatAgentSidebar />
						</SidebarContent>
					</Sidebar>
				</>
			) : (
				<div className="flex flex-1 flex-col items-center justify-center gap-2">
					<BotIcon className="size-12 stroke-1 opacity-50" />
					<p className="text-muted-foreground text-sm">
						Select an agent to start chatting
					</p>
				</div>
			)}
		</SidebarProvider>
	);
}
