"use client";

import { useQuery } from "@tanstack/react-query";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@ui/components/ui/sidebar";
import { HomeIcon, InboxIcon, SettingsIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { trpc } from "@/utils/trpc";
import { useUser } from "../user-provider";

export function SidebarWorkspace() {
	const user = useUser();
	const pathname = usePathname();

	const isInboxActive = pathname === `${user.basePath}/inbox`;
	const isSettingsActive = pathname.startsWith(`${user.basePath}/settings`);

	return (
		<SidebarGroup>
			<SidebarGroupLabel>Workspace</SidebarGroupLabel>
			<SidebarGroupContent>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton asChild>
							<Link href={`${user.basePath}`}>
								<HomeIcon />
								<span>Home</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
					<SidebarMenuItem>
						<SidebarMenuButton asChild isActive={isInboxActive}>
							<Link href={`${user.basePath}/inbox`}>
								<InboxIcon />
								<span>Inbox</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
					<SidebarMenuItem>
						<SidebarMenuButton asChild isActive={isSettingsActive}>
							<Link href={`${user.basePath}/settings/general`}>
								<SettingsIcon />
								<span>Settings</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
