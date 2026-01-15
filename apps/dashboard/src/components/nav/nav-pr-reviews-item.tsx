import { useQuery } from "@tanstack/react-query";
import { SidebarMenuButton, SidebarMenuItem } from "@ui/components/ui/sidebar";
import { cn } from "@ui/lib/utils";
import { FolderIcon, GitPullRequestIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/components/user-provider";
import { trpc } from "@/utils/trpc";
import {
	NavItem,
	NavItemContent,
	NavItemIcon,
	NavItemIconSecondary,
	NavItemIndicator,
	NavItemSubtitle,
	NavItemTitle,
} from "./nav-item";

export const NavPrReviewsItem = () => {
	const user = useUser();
	const pathname = usePathname();
	const { data: githubIntegration } = useQuery(
		trpc.integrations.getByType.queryOptions(
			{
				type: "github",
			},
			{
				staleTime: Number.POSITIVE_INFINITY,
			},
		),
	);

	const isInstalled = githubIntegration?.isInstalled;

	const { data: prReviewsCount } = useQuery(
		trpc.github.getPrreviewsCount.queryOptions(
			{
				state: ["open"],
				merged: false,
				draft: false,
			},
			{
				enabled: isInstalled === true && !!user?.id,
			},
		),
	);

	const isActive = pathname?.startsWith(`${user?.basePath}/pr-reviews`);

	if (!isInstalled) {
		return null;
	}

	return (
		<Link href={`${user?.basePath}/pr-reviews`}>
			<NavItem>
				<NavItemIcon>
					<FolderIcon />
					<NavItemIconSecondary>
						<GitPullRequestIcon />
					</NavItemIconSecondary>
					<NavItemIndicator show={!!prReviewsCount}>
						{prReviewsCount}
					</NavItemIndicator>
				</NavItemIcon>
				<NavItemContent>
					<NavItemTitle>Reviews</NavItemTitle>
					<NavItemSubtitle>Pull requests awaiting your review</NavItemSubtitle>
				</NavItemContent>
			</NavItem>
		</Link>
	);
};
