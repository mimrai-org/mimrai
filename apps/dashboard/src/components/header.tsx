"use client";

import { SidebarTrigger } from "@ui/components/ui/sidebar";
import { NavNotifications } from "./nav-notifications";

export default function Header() {
	return (
		<header className="h-[65px] bg-background">
			<div className="flex h-full flex-col items-start justify-center border-b px-6 py-4">
				<div className="flex w-full items-center justify-between">
					<SidebarTrigger />

					<div className="flex items-center gap-2">
						<NavNotifications />
					</div>
				</div>
			</div>
		</header>
	);
}
