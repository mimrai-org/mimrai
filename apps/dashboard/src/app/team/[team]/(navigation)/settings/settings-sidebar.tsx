"use client";
import { cn } from "@ui/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { useUser } from "@/components/user-provider";
import { getSettingsLinks } from "./nav-list";

export const SettingsSidebar = () => {
	const user = useUser();
	const pathname = usePathname();

	const settingsLinks = useMemo(() => {
		return getSettingsLinks(user.basePath);
	}, [user.basePath]);

	return (
		<div className="sticky top-4 flex flex-col gap-1 self-start rounded-sm border p-2 text-sm">
			{settingsLinks.map((link) => {
				const isActive = pathname === link.to;
				const Icon = link.icon;
				return (
					<Link key={link.to} href={link.to}>
						<div
							className={cn(
								"flex items-center gap-2 rounded-sm px-4 py-2 transition-colors hover:bg-accent dark:hover:bg-accent/30 [&_svg]:opacity-50",
								{
									"bg-accent [&_svg]:opacity-100": isActive,
								},
							)}
						>
							<Icon className="size-4" />
							{link.label}
						</div>
					</Link>
				);
			})}
		</div>
	);
};
