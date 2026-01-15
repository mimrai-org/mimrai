import { Suspense } from "react";
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
				<BreadcrumbsProvider session={session}>
					<Header />
					<div className="flex flex-col rounded-lg bg-background px-12 pb-4">
						{children}
					</div>
					{/* <ChatWidget /> */}
				</BreadcrumbsProvider>
			</Suspense>
		</>
	);
}
