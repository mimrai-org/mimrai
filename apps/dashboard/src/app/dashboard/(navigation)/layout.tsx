import { SidebarInset, SidebarProvider } from "@ui/components/ui/sidebar";
import { Suspense } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { ChatWidget } from "@/components/chat/chat-widget";
import Header from "@/components/header";
import { GlobalSheets } from "@/components/sheets/global-sheets";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<>
			{/*<Header />*/}
			<Suspense>
				<SidebarProvider>
					<AppSidebar collapsible="icon" />
					<SidebarInset>
						<Header />
						<div className="flex flex-1 flex-col px-6 py-6">{children}</div>
						<ChatWidget />
					</SidebarInset>
				</SidebarProvider>
			</Suspense>
			<Suspense>
				<GlobalSheets />
			</Suspense>
		</>
	);
}
