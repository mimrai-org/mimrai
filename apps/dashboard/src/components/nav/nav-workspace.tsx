"use client";
import {
	ChartPieIcon,
	FolderCog,
	FolderIcon,
	FoldersIcon,
	Maximize2Icon,
	SettingsIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavInboxItem } from "./nav-inbox-item";
import {
	NavItem,
	NavItemContent,
	NavItemIcon,
	NavItemIconSecondary,
	NavItemSubtitle,
	NavItemTitle,
} from "./nav-item";
import { NavPrReviewsItem } from "./nav-pr-reviews-item";

export const NavWorkspace = () => {
	const pathname = usePathname();
	return (
		<div className="flex flex-wrap">
			<Link href={`${pathname}/overview`}>
				<NavItem>
					<NavItemIcon>
						<FolderIcon />
						<NavItemIconSecondary>
							<ChartPieIcon />
						</NavItemIconSecondary>
					</NavItemIcon>
					<NavItemContent>
						<NavItemTitle>Overview</NavItemTitle>
						<NavItemSubtitle>Workspace overview</NavItemSubtitle>
					</NavItemContent>
				</NavItem>
			</Link>

			<NavInboxItem />
			<NavPrReviewsItem />

			<Link href={`${pathname}/projects`}>
				<NavItem>
					<NavItemIcon>
						<FolderIcon />
						<NavItemIconSecondary>
							<FoldersIcon />
						</NavItemIconSecondary>
					</NavItemIcon>
					<NavItemContent>
						<NavItemTitle>Projects</NavItemTitle>
						<NavItemSubtitle>View all projects</NavItemSubtitle>
					</NavItemContent>
				</NavItem>
			</Link>

			<Link href={`${pathname}/settings`}>
				<NavItem>
					<NavItemIcon>
						<FolderIcon />
						<NavItemIconSecondary>
							<SettingsIcon />
						</NavItemIconSecondary>
					</NavItemIcon>
					<NavItemContent>
						<NavItemTitle>Settings</NavItemTitle>
						<NavItemSubtitle>Manage settings</NavItemSubtitle>
					</NavItemContent>
				</NavItem>
			</Link>
		</div>
	);
};
