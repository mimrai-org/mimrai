import { FeedView } from "@/components/feed/view";
import { NavTopTasks } from "@/components/nav/nav-top-tasks";
import { NavWorkspace } from "@/components/nav/nav-workspace";
import { NavSearch } from "@/components/nav-search";
import { NavUser } from "@/components/nav-user";
import { ProjectsList } from "@/components/projects/list";
import { TeamSwitcher } from "@/components/team-switcher";
import { trpcClient } from "@/utils/trpc";

type Props = {
	searchParams: Promise<{
		[key: string]: string | string[] | undefined;
	}>;
};

export default async function Page({ searchParams }: Props) {
	const user = await trpcClient.users.getCurrent.query();

	return (
		<div className="animate-blur-in space-y-6 p-6">
			<div className="space-y-1">
				<div className="flex items-center justify-between">
					<h1 className="flex items-center gap-2 font-header text-4xl">
						Jump into your work
					</h1>
				</div>
				<p className="text-muted-foreground text-sm">
					Hello, {user?.name.split(" ")[0]}
				</p>
			</div>
			<NavTopTasks />
			<div>
				<FeedView />
			</div>
		</div>
	);
}
