import { SidebarInset, SidebarProvider } from "@ui/components/ui/sidebar";
import { Suspense } from "react";
import { AppSidebar, AppSidebarWrapper } from "@/components/app-sidebar/main";
import { BreadcrumbsProvider } from "@/components/breadcrumbs";
import Header from "@/components/header";
import { getSession } from "@/lib/get-session";

export default async function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await getSession();

	return (
		<>
			{/*<Header />*/}
			<Suspense>
				<SidebarProvider defaultOpen={true}>
					<AppSidebar />
					<BreadcrumbsProvider session={session}>
						<main className="flex flex-1 flex-col">
							<Header />
							<AppSidebarWrapper>{children}</AppSidebarWrapper>
							{/* <ChatWidget /> */}
						</main>
					</BreadcrumbsProvider>
				</SidebarProvider>
			</Suspense>
		</>
	);
}
