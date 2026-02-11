"use client";

import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@ui/components/ui/sidebar";
import { LayersIcon, MessagesSquareIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "../user-provider";

export function SidebarFocus() {
	const user = useUser();
	const pathname = usePathname();

	const isMyTasksActive = pathname === `${user.basePath}/views/my-tasks`;
	const isChatActive = pathname.startsWith(`${user.basePath}/chat`);

	return (
		<SidebarGroup>
			<SidebarGroupContent>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton asChild isActive={isMyTasksActive}>
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
						<SidebarMenuButton asChild isActive={isChatActive}>
							<Link href={`${user.basePath}/chat`}>
								<MessagesSquareIcon />
								<span>Agents Chat</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
