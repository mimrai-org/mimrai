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
import { SidebarFocus } from "./sidebar-focus";
import { SidebarProjects } from "./sidebar-projects";
import { SidebarWorkspace } from "./sidebar-workspace";

export function AppSidebar() {
	const { open } = useSidebar();

	return (
		<Sidebar collapsible="icon" className="">
			<SidebarHeader className="h-[48px]">
				<div
					className={cn(
						"group/header relative flex h-full items-center justify-between",
						{
							"justify-center": !open,
						},
					)}
				>
					<div className="flex items-center gap-2">
						<Logo
							className={cn("size-8", {
								"opacity-100 transition-opacity group-hover/header:opacity-0":
									!open,
							})}
						/>
						<span
							className={cn("font-header font-medium text-foreground", {
								hidden: !open,
							})}
						>
							MIMRAI
						</span>
					</div>
					<SidebarTrigger
						className={cn({
							"absolute inset-0 opacity-0 transition-opacity group-hover/header:opacity-100":
								!open,
						})}
					/>
				</div>
			</SidebarHeader>
			<SidebarContent>
				<SidebarFocus />
				<SidebarProjects />
				<SidebarWorkspace />
			</SidebarContent>
		</Sidebar>
	);
}

export const AppSidebarWrapper = ({
	children,
}: {
	children: React.ReactNode;
}) => {
	const { open } = useSidebar();

	return (
		<div
			className={cn(
				"relative flex max-h-[calc(100vh-48px)] flex-1 flex-col rounded-lg bg-background p-4 [&:has([data-slot=sidebar-wrapper])]:p-0",
				{
					"md:max-w-[calc(100vw-256px)]": open,
				},
			)}
		>
			{children}
		</div>
	);
};
