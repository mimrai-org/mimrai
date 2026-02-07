"use client";
import { t } from "@mimir/locale";
import {
	BellIcon,
	BotIcon,
	CableIcon,
	CircleDashedIcon,
	CloudUploadIcon,
	CreditCardIcon,
	FolderIcon,
	KeyRoundIcon,
	MaximizeIcon,
	ServerIcon,
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
	NavItemIcon,
	NavItemIconSecondary,
	NavItemTitle,
} from "@/components/nav/nav-item";
import { useUser } from "@/components/user-provider";

export const getSettingsLinks = (basePath: string) => [
	{
		icon: SettingsIcon,
		to: `${basePath}/settings/general`,
		label: t("settings.sidebar.general"),
	},
	{
		icon: UserIcon,
		to: `${basePath}/settings/profile`,
		label: t("settings.sidebar.profile"),
	},
	{
		icon: CreditCardIcon,
		to: `${basePath}/settings/billing`,
		label: t("settings.sidebar.billing"),
		scopes: ["team:write"],
	},
	{
		icon: UsersIcon,
		to: `${basePath}/settings/members`,
		label: t("settings.sidebar.members"),
	},
	{
		icon: TagsIcon,
		to: `${basePath}/settings/labels`,
		label: t("settings.sidebar.labels"),
	},
	{
		icon: CircleDashedIcon,
		to: `${basePath}/settings/statuses`,
		label: t("settings.sidebar.statuses"),
	},
	{
		icon: BellIcon,
		to: `${basePath}/settings/notifications`,
		label: t("settings.sidebar.notifications"),
	},
	{
		icon: BotIcon,
		to: `${basePath}/settings/agents`,
		label: "Agents",
		scopes: ["team:write"],
	},
	{
		icon: SparklesIcon,
		to: `${basePath}/settings/autopilot`,
		label: "Autopilot",
		scopes: ["team:write"],
	},
	{
		icon: CableIcon,
		to: `${basePath}/settings/integrations`,
		label: t("settings.sidebar.integrations"),
	},
	{
		icon: KeyRoundIcon,
		to: `${basePath}/settings/api-keys`,
		label: "API Keys",
	},
	{
		icon: ServerIcon,
		to: `${basePath}/settings/mcp-servers`,
		label: "MCP Servers",
	},
	{
		icon: CloudUploadIcon,
		to: `${basePath}/settings/import`,
		label: t("settings.sidebar.import"),
	},
];

export const NavList = () => {
	const user = useUser();

	const settingsLinks = useMemo(() => {
		return getSettingsLinks(user.basePath);
	}, [user.basePath]);

	if (!user) return null;

	return (
		<div className="mx-auto h-fit w-full max-w-5xl">
			<ul className="grid grid-cols-5 gap-2">
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
								<NavItemIcon>
									<FolderIcon />
									<NavItemIconSecondary>
										<Icon />
									</NavItemIconSecondary>
								</NavItemIcon>
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
