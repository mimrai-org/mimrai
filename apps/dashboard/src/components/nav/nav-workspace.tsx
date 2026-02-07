"use client";
import {
	ChartPieIcon,
	FolderIcon,
	FoldersIcon,
	KanbanIcon,
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
		<div className="grid grid-cols-4 gap-2">
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

			<Link href={`${pathname}/views`}>
				<NavItem>
					<NavItemIcon>
						<FolderIcon />
						<NavItemIconSecondary>
							<KanbanIcon />
						</NavItemIconSecondary>
					</NavItemIcon>
					<NavItemContent>
						<NavItemTitle>Views</NavItemTitle>
						<NavItemSubtitle>View all task views</NavItemSubtitle>
					</NavItemContent>
				</NavItem>
			</Link>

			<Link href={`${pathname}/settings/general`}>
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
