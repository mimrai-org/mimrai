"use client";

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@ui/components/ui/sidebar";
import {
	Command,
	LayersIcon,
	LayoutDashboardIcon,
	LifeBuoy,
	type LucideIcon,
	Send,
	Settings2,
} from "lucide-react";
import type * as React from "react";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import { useUser } from "@/hooks/use-user";
import { SidebarSubscriptionStatus } from "./sidebar-subscription-status";
import { TeamSwitcher } from "./team-switcher";

type Item = {
	title: string;
	url: string;
	icon: LucideIcon;
	items?: Omit<Item, "icon" | "items">[];
	isActive?: boolean;
};

const data: {
	navMain: Item[];
	navSecondary: Item[];
} = {
	navMain: [
		{
			title: "Overview",
			url: "/dashboard/overview",
			icon: LayoutDashboardIcon,
		},
		{
			title: "Tasks",
			url: "/dashboard/board",
			icon: LayersIcon,
			items: [
				{
					title: "Board",
					url: "/dashboard/board",
				},
				{
					title: "Backlog",
					url: "/dashboard/backlog",
				},
			],
		},
		{
			title: "Settings",
			url: "/dashboard/settings",
			icon: Settings2,
			items: [
				{
					title: "General",
					url: "/dashboard/settings/general",
				},
				{
					title: "Billing",
					url: "/dashboard/settings/billing",
				},
				{
					title: "Members",
					url: "/dashboard/settings/members",
				},
				{
					title: "Labels",
					url: "/dashboard/settings/labels",
				},
				{
					title: "Columns",
					url: "/dashboard/settings/columns",
				},
				{
					title: "Notifications",
					url: "/dashboard/settings/notifications",
				},
				{
					title: "Integrations",
					url: "/dashboard/settings/integrations",
				},
			],
		},
	],
	navSecondary: [],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const user = useUser();

	return (
		<Sidebar variant="sidebar" {...props}>
			<SidebarHeader className="h-[65px] border-b">
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size="lg" asChild className="">
							<div>
								<TeamSwitcher />
							</div>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={data.navMain} />
				<div className="mt-auto mb-2 flex flex-col space-y-2">
					<NavSecondary items={data.navSecondary} />
					<SidebarSubscriptionStatus />
				</div>
			</SidebarContent>
			<SidebarFooter className="border-t">
				<NavUser user={user!} />
			</SidebarFooter>
		</Sidebar>
	);
}
