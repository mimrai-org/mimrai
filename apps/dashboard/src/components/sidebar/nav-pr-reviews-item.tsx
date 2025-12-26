import { useQuery } from "@tanstack/react-query";
import { SidebarMenuButton, SidebarMenuItem } from "@ui/components/ui/sidebar";
import { cn } from "@ui/lib/utils";
import { GitPullRequestIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { trpc } from "@/utils/trpc";
import type { NavItem } from "../app-sidebar";

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
		<SidebarMenuItem>
			<SidebarMenuButton asChild isActive={isActive}>
				<Link href={`${user?.basePath}/pr-reviews`}>
					<GitPullRequestIcon />
					<span>Reviews</span>

					<span className="ml-auto flex size-5 items-center justify-center rounded-sm bg-red-400 text-white text-xs">
						{prReviewsCount}
					</span>
				</Link>
			</SidebarMenuButton>
		</SidebarMenuItem>
	);
};
