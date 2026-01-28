import { SidebarProvider } from "@ui/components/ui/sidebar";
import { Suspense } from "react";
import { AppSidebar } from "@/components/app-sidebar/main";
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
				<SidebarProvider defaultOpen={false}>
					<AppSidebar />
					<main className="flex-1 px-6">
						<BreadcrumbsProvider session={session}>
							<Header />
							<div className="container mx-auto flex flex-col rounded-lg bg-background pb-4">
								{children}
							</div>
							{/* <ChatWidget /> */}
						</BreadcrumbsProvider>
					</main>
				</SidebarProvider>
			</Suspense>
		</>
	);
}
