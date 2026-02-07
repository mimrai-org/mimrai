"use client";

import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@ui/components/ui/sidebar";
import { LayersIcon, MessagesSquareIcon } from "lucide-react";
import Link from "next/link";
import { useUser } from "../user-provider";

export function SidebarFocus() {
	const user = useUser();

	return (
		<SidebarGroup>
			<SidebarGroupLabel>Focus</SidebarGroupLabel>
			<SidebarGroupContent>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton asChild>
							<Link href={`${user.basePath}/views/my-tasks`}>
								<LayersIcon />
								<span>My Tasks</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarGroupContent>
			<SidebarGroupContent>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton asChild>
							<Link href={`${user.basePath}/chat`}>
								<MessagesSquareIcon />
								<span>Chat</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
