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
	GitPullRequestIcon,
	LayersIcon,
	LayoutDashboardIcon,
	type LucideIcon,
	ScanIcon,
	Settings2,
} from "lucide-react";
import type * as React from "react";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavProjects } from "./sidebar/nav-projects";
import { NavWorkspace } from "./sidebar/nav-workspace";
import { PrReviewsNavItem } from "./sidebar/pr-reviews-item";
import { SidebarSubscriptionStatus } from "./sidebar-subscription-status";
import { TeamSwitcher } from "./team-switcher";

export type NavItem =
	| {
			title: string;
			url: string;
			key: string;
			icon: LucideIcon;
			customComponent?: React.ComponentType<{
				item: NavItem;
				isActive?: boolean;
			}>;
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
			key: "overview",
			url: "/team/{team}/overview",
			icon: LayoutDashboardIcon,
		},
		{
			title: "My Tasks",
			key: "my-tasks",
			url: "/team/{team}/my-tasks",
			icon: ScanIcon,
		},
		{
			title: "Reviews",
			key: "reviews",
			url: "/team/{team}/pr-reviews",
			icon: GitPullRequestIcon,
			customComponent: PrReviewsNavItem,
		},
	],
	navSecondary: [
		{
			title: "Settings",
			key: "settings",
			url: "/team/{team}/settings",
			icon: Settings2,
		},
	],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar variant="inset" {...props}>
			<SidebarHeader className="flex h-[55px] flex-col items-center justify-center">
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
				<NavWorkspace />
				<div className="mt-auto mb-2 flex flex-col space-y-2">
					<NavSecondary items={data.navSecondary} />
					<SidebarSubscriptionStatus />
				</div>
			</SidebarContent>
		</Sidebar>
	);
}
