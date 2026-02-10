"use client";

import { Breadcrumbs } from "./breadcrumbs";
import { NavSearch } from "./nav-search";
import { NavUser } from "./nav-user";

export default function Header() {
	return (
		<header className="sticky top-0 z-5 h-[48px] border-b bg-background px-4">
			<div className="h-full px-4 sm:px-0">
				<div className="flex h-full flex-col items-start justify-center">
					<div className="flex w-full items-center justify-between">
						<div className="flex items-center gap-4">
							<Breadcrumbs />
							<NavSearch />
						</div>
						<div className="flex items-center gap-4">
							{/* <NavSuggestions /> */}
							<NavUser />
						</div>
					</div>
				</div>
			</div>
		</header>
	);
}
