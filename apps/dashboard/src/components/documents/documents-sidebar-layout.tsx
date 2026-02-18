"use client";

import {
	Sidebar,
	SidebarContent,
	SidebarProvider,
} from "@ui/components/ui/sidebar";
import { DocumentsSidebar } from "./documents-sidebar";

export function DocumentsSidebarLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<SidebarProvider
			defaultOpen={true}
			className="min-h-[calc(100svh-48px)]"
			style={
				{
					"--sidebar-width": "240px",
				} as React.CSSProperties
			}
		>
			<Sidebar collapsible="none" className="border-r bg-transparent">
				<SidebarContent>
					<DocumentsSidebar />
				</SidebarContent>
			</Sidebar>
			<div className="flex-1 overflow-y-auto p-6">{children}</div>
		</SidebarProvider>
	);
}
