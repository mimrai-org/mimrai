"use client";

import { Breadcrumbs } from "./breadcrumbs";
import { NavSearch } from "./nav-search";
import { NavUser } from "./nav-user";
import { StickySidebarClose } from "./sticky-sidebar";

export default function Header() {
	return (
		<header className="mb-2 h-[55px]">
			<div className="container mx-auto h-full px-4 sm:px-0">
				<div className="flex h-full flex-col items-start justify-center py-4">
					<div className="flex w-full items-center justify-between">
						<div className="flex items-center gap-4">
							<StickySidebarClose />
							<Breadcrumbs />
							<NavSearch />
						</div>
						<div className="flex items-center gap-4">
							{/* <NavSuggestions /> */}
							<div className="ml-2">
								<NavUser />
							</div>
						</div>
					</div>
				</div>
			</div>
		</header>
	);
}
