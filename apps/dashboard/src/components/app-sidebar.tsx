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
	BoxIcon,
	LayersIcon,
	LayoutDashboardIcon,
	type LucideIcon,
	ScanFaceIcon,
	ScanIcon,
	Settings2,
} from "lucide-react";
import type * as React from "react";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
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
			url: "/team/{team}/overview",
			icon: LayoutDashboardIcon,
		},
		{
			title: "My Tasks",
			url: "/team/{team}/my-tasks",
			icon: ScanIcon,
		},
		{
			title: "Tasks",
			url: "/team/{team}/board",
			icon: LayersIcon,
			items: [
				{
					title: "Board",
					url: "/team/{team}/board",
				},
				{
					title: "Backlog",
					url: "/team/{team}/backlog",
				},
				{
					title: "Recurring",
					url: "/team/{team}/recurring",
				},
				{
					title: "Done",
					url: "/team/{team}/done",
				},
			],
		},
		{
			title: "Projects",
			url: "/team/{team}/projects",
			icon: BoxIcon,
			items: [
				{
					title: "Timeline",
					url: "/team/{team}/projects/timeline",
				},
			],
		},
		{
			title: "Settings",
			url: "/team/{team}/settings",
			icon: Settings2,
			items: [
				{
					title: "General",
					url: "/team/{team}/settings/general",
				},
				{
					title: "Billing",
					url: "/team/{team}/settings/billing",
					scopes: ["team:write"],
				},
				{
					title: "Members",
					url: "/team/{team}/settings/members",
				},
				{
					title: "Labels",
					url: "/team/{team}/settings/labels",
				},
				{
					title: "Statuses",
					url: "/team/{team}/settings/statuses",
				},
				{
					title: "Notifications",
					url: "/team/{team}/settings/notifications",
				},
				{
					title: "Integrations",
					url: "/team/{team}/settings/integrations",
				},
			],
		},
	],
	navSecondary: [],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar variant="inset" {...props}>
			<SidebarHeader className="flex h-[65px] flex-col items-center justify-center">
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
		</Sidebar>
	);
}
