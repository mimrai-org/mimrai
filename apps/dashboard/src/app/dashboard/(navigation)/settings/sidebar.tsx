"use client";
import { t } from "@mimir/locale";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

export const SettingsSidebar = () => {
	const pathname = usePathname();
	const settingsLinks = useMemo(() => {
		return [
			{
				to: "/dashboard/settings/general",
				label: t("settings.sidebar.general"),
			},
			{
				to: "/dashboard/settings/profile",
				label: t("settings.sidebar.profile"),
			},
			{
				to: "/dashboard/settings/billing",
				label: t("settings.sidebar.billing"),
			},
			{
				to: "/dashboard/settings/members",
				label: t("settings.sidebar.members"),
			},
			{ to: "/dashboard/settings/labels", label: t("settings.sidebar.labels") },
			{
				to: "/dashboard/settings/notifications",
				label: t("settings.sidebar.notifications"),
			},
			{
				to: "/dashboard/settings/resumes",
				label: t("settings.sidebar.resumes"),
			},
			{
				to: "/dashboard/settings/integrations",
				label: t("settings.sidebar.integrations"),
			},
			{ to: "/dashboard/settings/import", label: t("settings.sidebar.import") },
		];
	}, []);

	return (
		<div className="sticky top-8 h-fit w-full border p-4">
			<ul className="flex flex-col space-y-1 text-sm">
				{settingsLinks.map(({ to, label }) => (
					<Link
						href={to}
						key={to}
						className={cn(
							"rounded-none border border-transparent px-4 py-2 transition-all hover:border-muted hover:text-accent-foreground",
							{
								"bg-accent font-medium text-accent-foreground":
									pathname.includes(to),
							},
						)}
					>
						<li>{label}</li>
					</Link>
				))}
			</ul>
		</div>
	);
};
