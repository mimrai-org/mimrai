import { useQuery } from "@tanstack/react-query";
import { cn } from "@ui/lib/utils";
import Link from "next/link";
import { useUser } from "@/hooks/use-user";
import { trpc } from "@/utils/trpc";
import type { NavItem } from "../app-sidebar";

export const PrReviewsNavItem = ({
	item,
	className,
	isActive,
}: {
	item: NavItem;
	isActive?: boolean;
	className?: string;
}) => {
	const user = useUser();
	const { data: githubIntegration } = useQuery(
		trpc.integrations.getByType.queryOptions(
			{
				type: "github",
			},
			{
				refetchOnMount: false,
				refetchOnWindowFocus: false,
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

	if ("customComponent" in item === false) {
		return null;
	}

	if (!isInstalled) {
		return null;
	}

	const addTeamToUrl = (url: string) => {
		if (url.includes("{team}")) {
			return url.replace("{team}", user?.team?.slug || "");
		}
		return url;
	};

	return (
		<Link
			href={addTeamToUrl(item.url)}
			className={cn(
				"flex h-8 items-center border border-transparent text-sm!",
				{
					"bg-sidebar-accent text-sidebar-accent-foreground": isActive,
				},
				className,
			)}
		>
			<item.icon className="size-4! text-muted-foreground" />
			<span>{item.title}</span>

			<span className="ml-auto flex size-5 items-center justify-center rounded-sm bg-red-400 text-white text-xs">
				{prReviewsCount}
			</span>
		</Link>
	);
};
