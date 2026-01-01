"use client";

import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@ui/components/ui/sidebar";
import { type LucideIcon, Settings2 } from "lucide-react";
import type * as React from "react";
import { NavSecondary } from "@/components/nav-secondary";
import { NavMainGroup } from "./sidebar/nav-main-group";
import { NavWorkspace } from "./sidebar/nav-workspace";
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
	navMain: [],
	navSecondary: [
		{
			title: "Settings",
			key: "settings",
			url: "/team/{team}/settings/general",
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
				<NavMainGroup />
				<NavWorkspace />
				<div className="mt-auto mb-2 flex flex-col space-y-2">
					<NavSecondary items={data.navSecondary} />
					<SidebarSubscriptionStatus />
				</div>
			</SidebarContent>
		</Sidebar>
	);
}
