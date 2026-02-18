"use client";

import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@ui/components/ui/sidebar";
import {
	BotIcon,
	ClipboardClockIcon,
	FileTextIcon,
	HomeIcon,
	InboxIcon,
	SettingsIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "../user-provider";

export function SidebarWorkspace() {
	const user = useUser();
	const pathname = usePathname();

	const isInboxActive = pathname === `${user.basePath}/inbox`;
	const isRecurringActive = pathname === `${user.basePath}/recurring`;
	const isDocumentsActive = pathname.startsWith(`${user.basePath}/documents`);
	const isSettingsActive = pathname.startsWith(`${user.basePath}/settings`);
	// const isAgentsActive = pathname.startsWith(
	// 	`${user.basePath}/settings/agents`,
	// );

	return (
		<SidebarGroup>
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
					{/* <SidebarMenuItem>
						<SidebarMenuButton asChild isActive={isAgentsActive}>
							<Link href={`${user.basePath}/settings/agents`}>
								<BotIcon />
								<span>Agents</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem> */}
					<SidebarMenuItem>
						<SidebarMenuButton asChild isActive={isDocumentsActive}>
							<Link href={`${user.basePath}/documents`}>
								<FileTextIcon />
								<span>Documents</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
					<SidebarMenuItem>
						<SidebarMenuButton asChild isActive={isRecurringActive}>
							<Link href={`${user.basePath}/recurring`}>
								<ClipboardClockIcon />
								<span>Recurring</span>
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
