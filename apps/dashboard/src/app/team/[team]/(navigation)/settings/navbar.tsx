"use client";
import { t } from "@mimir/locale";
import {
	BellIcon,
	CableIcon,
	CircleDashedIcon,
	CloudUploadIcon,
	CreditCardIcon,
	MaximizeIcon,
	SettingsIcon,
	SparklesIcon,
	TagsIcon,
	UserIcon,
	UsersIcon,
} from "lucide-react";
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
				icon: SettingsIcon,
				to: addTeamToUrl("/settings/general"),
				label: t("settings.sidebar.general"),
			},
			{
				icon: UserIcon,
				to: addTeamToUrl("/settings/profile"),
				label: t("settings.sidebar.profile"),
			},
			{
				icon: CreditCardIcon,
				to: addTeamToUrl("/settings/billing"),
				label: t("settings.sidebar.billing"),
				scopes: ["team:write"],
			},
			{
				icon: UsersIcon,
				to: addTeamToUrl("/settings/members"),
				label: t("settings.sidebar.members"),
			},
			{
				icon: TagsIcon,
				to: addTeamToUrl("/settings/labels"),
				label: t("settings.sidebar.labels"),
			},
			{
				icon: CircleDashedIcon,
				to: addTeamToUrl("/settings/statuses"),
				label: t("settings.sidebar.statuses"),
			},
			{
				icon: BellIcon,
				to: addTeamToUrl("/settings/notifications"),
				label: t("settings.sidebar.notifications"),
			},
			{
				icon: SparklesIcon,
				to: addTeamToUrl("/settings/autopilot"),
				label: "Autopilot",
				scopes: ["team:write"],
			},
			{
				icon: MaximizeIcon,
				to: addTeamToUrl("/settings/zen"),
				label: "Zen Mode",
			},
			{
				icon: CableIcon,
				to: addTeamToUrl("/settings/integrations"),
				label: t("settings.sidebar.integrations"),
			},
			{
				icon: CloudUploadIcon,
				to: addTeamToUrl("/settings/import"),
				label: t("settings.sidebar.import"),
			},
		];
	}, [user]);

	if (!user) return null;

	return (
		<div className="h-fit w-full">
			<ul className="flex space-x-1 overflow-x-auto text-sm">
				{settingsLinks.map(({ to, label, scopes, icon: Icon }) => {
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
								"flex items-center gap-1 rounded-sm px-4 py-2 transition-all hover:bg-accent/50 hover:text-accent-foreground",
								{
									"bg-accent font-medium text-foreground":
										pathname.includes(to),
								},
							)}
						>
							<Icon className="size-4" />
							<li>{label}</li>
						</Link>
					);
				})}
			</ul>
		</div>
	);
};
