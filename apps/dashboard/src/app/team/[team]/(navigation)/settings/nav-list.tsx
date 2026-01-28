"use client";
import { t } from "@mimir/locale";
import {
	BellIcon,
	CableIcon,
	CircleDashedIcon,
	CloudUploadIcon,
	CreditCardIcon,
	FolderIcon,
	KeyRoundIcon,
	MaximizeIcon,
	SettingsIcon,
	SparklesIcon,
	TagsIcon,
	UserIcon,
	UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import {
	NavItem,
	NavItemContent,
	NavItemTitle,
} from "@/components/nav/nav-item";
import { useUser } from "@/components/user-provider";

export const NavList = () => {
	const user = useUser();

	const addTeamToUrl = (url: string) => {
		if (!user?.team) return url;
		return `${user?.basePath}${url}`;
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
				icon: KeyRoundIcon,
				to: addTeamToUrl("/settings/api-keys"),
				label: "API Keys",
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
			<ul className="flex flex-wrap gap-4">
				{settingsLinks.map(({ to, label, scopes, icon: Icon }) => {
					if (
						scopes &&
						!scopes.every((scope) =>
							(user?.team?.scopes as string[])?.includes(scope),
						)
					)
						return null;
					return (
						<Link href={to} key={to} className="min-w-[100px]">
							<NavItem>
								<div className="relative">
									<FolderIcon className="size-10" />
									<Icon className="absolute bottom-0 left-0 size-4 bg-background" />
								</div>
								<NavItemContent>
									<NavItemTitle>{label}</NavItemTitle>
								</NavItemContent>
							</NavItem>
						</Link>
					);
				})}
			</ul>
		</div>
	);
};
