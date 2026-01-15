import { SunIcon } from "lucide-react";
import { NavTopTasks } from "@/components/nav/nav-top-tasks";
import { NavWorkspace } from "@/components/nav/nav-workspace";
import { NavSearch } from "@/components/nav-search";
import { ProjectsList } from "@/components/projects/list";
import { TeamSwitcher } from "@/components/team-switcher";
import { getSession } from "@/lib/get-session";
import { trpc } from "@/utils/trpc";
import { getQueryClient, HydrateClient } from "@/utils/trpc-server";

type Props = {
	searchParams: Promise<{
		[key: string]: string | string[] | undefined;
	}>;
};

export default async function Page({ searchParams }: Props) {
	const session = await getSession();
	const queryClient = getQueryClient();

	queryClient.prefetchQuery(trpc.zen.queue.queryOptions());
	queryClient.prefetchInfiniteQuery(
		trpc.projects.get.infiniteQueryOptions({
			pageSize: 20,
			search: "",
		}),
	);
	queryClient.prefetchQuery(
		trpc.integrations.getByType.queryOptions({
			type: "github",
		}),
	);
	queryClient.prefetchQuery(trpc.teams.getAvailable.queryOptions());
	queryClient.prefetchQuery(trpc.users.getCurrent.queryOptions(undefined));

	return (
		<HydrateClient>
			<div className="flex h-screen w-screen flex-col items-center justify-center pb-4">
				<div className="w-4xl animate-blur-in space-y-8">
					<div className="space-y-1">
						<div className="w-fit">
							<TeamSwitcher />
						</div>
						<h1 className="flex items-center gap-2 font-header text-4xl">
							Hello, {session?.user?.name.split(" ")[0]}
						</h1>
						<p className="text-muted-foreground text-sm">
							All your projects in one place.
						</p>
					</div>
					<NavTopTasks />
					<NavSearch />
					<NavWorkspace />
					<ProjectsList showFilters={false} />
				</div>
			</div>
		</HydrateClient>
	);
}
