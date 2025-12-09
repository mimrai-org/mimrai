"use client";

import { SidebarTrigger } from "@ui/components/ui/sidebar";
import { NavZenMode } from "./nav-focus-mode";
import { NavNotifications } from "./nav-notifications";
import { NavSearch } from "./nav-search";
import { NavSuggestions } from "./nav-suggestions";
import { NavUser } from "./nav-user";

export default function Header() {
	return (
		<header className="h-[65px] bg-background">
			<div className="flex h-full flex-col items-start justify-center border-b px-6 py-4">
				<div className="flex w-full items-center justify-between">
					<div className="flex items-center gap-4">
						<SidebarTrigger />
						<NavSearch />
					</div>

					<div className="flex items-center gap-4">
						<NavZenMode />
						<NavSuggestions />
						<NavNotifications />
						<div className="ml-2">
							<NavUser />
						</div>
					</div>
				</div>
			</div>
		</header>
	);
}
