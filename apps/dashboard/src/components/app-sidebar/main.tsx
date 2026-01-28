"use client";

import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
	SidebarTrigger,
	useSidebar,
} from "@ui/components/ui/sidebar";
import { cn } from "@ui/lib/utils";
import { Logo } from "@/components/logo";
import { SidebarProjects } from "./sidebar-projects";
import { SidebarWorkspace } from "./sidebar-workspace";

export function AppSidebar() {
	const { open } = useSidebar();

	return (
		<Sidebar collapsible="icon" className="border-none">
			<SidebarHeader className="h-[48px]">
				<div
					className={cn(
						"group/header relative flex h-full items-center justify-between",
						{
							"justify-center": !open,
						},
					)}
				>
					<Logo
						className={cn("size-5", {
							"opacity-100 transition-opacity group-hover/header:opacity-0":
								!open,
						})}
					/>
					<SidebarTrigger
						className={cn({
							"absolute inset-0 opacity-0 transition-opacity group-hover/header:opacity-100":
								!open,
						})}
					/>
				</div>
			</SidebarHeader>
			<SidebarContent>
				<SidebarProjects />
				<SidebarWorkspace />
			</SidebarContent>
		</Sidebar>
	);
}
