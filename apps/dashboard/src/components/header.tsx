"use client";

import { SidebarTrigger } from "@ui/components/ui/sidebar";

export default function Header() {
	return (
		<header className="h-[65px] bg-background">
			<div className="flex h-full flex-col items-start justify-center border-b px-6 py-4">
				<div className="flex w-full items-center justify-between">
					<SidebarTrigger />
				</div>
			</div>
		</header>
	);
}
