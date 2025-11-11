"use client";

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@ui/components/ui/sidebar";
import {
	BoxIcon,
	LayersIcon,
	LayoutDashboardIcon,
	type LucideIcon,
	Settings2,
} from "lucide-react";
import type * as React from "react";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import { useUser } from "@/hooks/use-user";
import { CreateButton } from "./create-button";
import { SidebarSubscriptionStatus } from "./sidebar-subscription-status";
import { TeamSwitcher } from "./team-switcher";

type Item = {
	title: string;
	url: string;
	icon: LucideIcon;
	items?: Omit<Item, "icon" | "items">[];
	scopes?: string[];
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
					title: "Workstation",
					url: "/dashboard/workstation",
				},
				{
					title: "Board",
					url: "/dashboard/board",
				},
				{
					title: "Backlog",
					url: "/dashboard/backlog",
				},
				{
					title: "Recurring",
					url: "/dashboard/recurring",
				},
				{
					title: "Done",
					url: "/dashboard/done",
				},
			],
		},
		{
			title: "Projects",
			url: "/dashboard/projects",
			icon: BoxIcon,
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
					scopes: ["team:write"],
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
			<SidebarHeader className="flex h-[65px] flex-col items-center justify-center border-b">
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
			<SidebarFooter className="">
				<NavUser user={user!} />
			</SidebarFooter>
		</Sidebar>
	);
}
