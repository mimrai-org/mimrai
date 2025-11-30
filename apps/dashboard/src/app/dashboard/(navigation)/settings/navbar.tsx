"use client";
import { t } from "@mimir/locale";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils";

export const SettingsNavbar = () => {
	const user = useUser();
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
				scopes: ["team:write"],
			},
			{
				to: "/dashboard/settings/members",
				label: t("settings.sidebar.members"),
			},
			{ to: "/dashboard/settings/labels", label: t("settings.sidebar.labels") },
			{
				to: "/dashboard/settings/columns",
				label: t("settings.sidebar.columns"),
			},
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

	if (!user) return null;

	return (
		<div className="h-fit w-full">
			<ul className="flex space-x-1 overflow-x-auto text-sm">
				{settingsLinks.map(({ to, label, scopes }) => {
					if (
						scopes &&
						!scopes.every((scope) =>
							(user?.team?.scopes as string[])?.includes(scope),
						)
					)
						return null;
					return (
						<Link
							href={to}
							key={to}
							className={cn(
								"rounded-sm border border-transparent px-4 py-2 transition-all hover:border-muted hover:text-accent-foreground",
								{
									"bg-background font-medium text-foreground":
										pathname.includes(to),
								},
							)}
						>
							<li>{label}</li>
						</Link>
					);
				})}
			</ul>
		</div>
	);
};
