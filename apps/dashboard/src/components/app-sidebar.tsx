"use client";

import {
	Sidebar,
	SidebarContent,
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
	ScanIcon,
	Settings2,
} from "lucide-react";
import type * as React from "react";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { SidebarSubscriptionStatus } from "./sidebar-subscription-status";
import { TeamSwitcher } from "./team-switcher";

export type NavItem =
	| {
			title: string;
			url: string;
			icon: LucideIcon;
			items?: {
				title: string;
				url: string;
				scopes?: string[];
			}[];
			scopes?: string[];
			isActive?: boolean;
	  }
	| {
			header: string;
	  }
	| {
			spacing: number;
	  };

const data: {
	navMain: NavItem[];
	navSecondary: NavItem[];
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
			header: "Workspace",
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
	],
	navSecondary: [
		{
			title: "Settings",
			url: "/team/{team}/settings",
			icon: Settings2,
		},
	],
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
