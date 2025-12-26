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

	const addTeamToUrl = (url: string) => {
		if (!user?.team) return url;
		return `${user.basePath}${url}`;
	};

	const settingsLinks = useMemo(() => {
		return [
			{
				to: addTeamToUrl("/settings/general"),
				label: t("settings.sidebar.general"),
			},
			{
				to: addTeamToUrl("/settings/profile"),
				label: t("settings.sidebar.profile"),
			},
			{
				to: addTeamToUrl("/settings/billing"),
				label: t("settings.sidebar.billing"),
				scopes: ["team:write"],
			},
			{
				to: addTeamToUrl("/settings/members"),
				label: t("settings.sidebar.members"),
			},
			{
				to: addTeamToUrl("/settings/labels"),
				label: t("settings.sidebar.labels"),
			},
			{
				to: addTeamToUrl("/settings/statuses"),
				label: t("settings.sidebar.statuses"),
			},
			{
				to: addTeamToUrl("/settings/notifications"),
				label: t("settings.sidebar.notifications"),
			},
			{
				to: addTeamToUrl("/settings/autopilot"),
				label: "Autopilot",
				scopes: ["team:write"],
			},
			{
				to: addTeamToUrl("/settings/integrations"),
				label: t("settings.sidebar.integrations"),
			},
			{
				to: addTeamToUrl("/settings/import"),
				label: t("settings.sidebar.import"),
			},
		];
	}, [user]);

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
									"bg-card font-medium text-foreground": pathname.includes(to),
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
