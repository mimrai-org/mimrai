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
					<SidebarInset className="overflow-x-hidden">
						<Header />
						<div className="flex flex-1 flex-col">{children}</div>
						<ChatWidget />

						{/* Add a noise background */}
						{/* <div className="pointer-events-none fixed inset-0 z-0 size-full overflow-hidden">
							<svg
								className="size-full"
								preserveAspectRatio="xMidYMid slice"
								xmlns="http://www.w3.org/2000/svg"
							>
								<filter id="noiseFilter">
									<feTurbulence
										type="fractalNoise"
										baseFrequency="0.8"
										numOctaves="8"
										stitchTiles="stitch"
									/>
								</filter>
								<rect
									width="100%"
									height="100%"
									className="size-full"
									filter="url(#noiseFilter)"
									opacity="0.03"
								/>
							</svg>
						</div> */}
					</SidebarInset>
				</SidebarProvider>
			</Suspense>
		</>
	);
}
