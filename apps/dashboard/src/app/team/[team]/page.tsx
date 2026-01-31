import { ChatInterface } from "@/components/chat/chat-interface";
import { ChatProvider } from "@/components/chat/chat-provider";
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
		<div className="flex h-screen w-screen flex-col items-center overflow-y-auto pb-4">
			<div className="w-4xl animate-blur-in space-y-6 pt-[calc(100vh/6)]">
				<div className="space-y-1">
					<div className="w-fit">
						<TeamSwitcher />
					</div>
					<div className="flex items-center justify-between">
						<h1 className="flex items-center gap-2 font-header text-4xl">
							Jump into your work
						</h1>

						<NavUser />
					</div>
					<p className="text-muted-foreground text-sm">
						Hello, {user?.name.split(" ")[0]}
					</p>
				</div>
				<NavSearch
					className="w-fit"
					placeholder="Search tasks, projects, milestones and more"
				/>
				<NavTopTasks />
				<div>
					<h2 className="mb-2 font-header">Pick a project</h2>
					<ProjectsList showFilters={false} />
				</div>
				<div>
					<h2 className="mb-2 font-header">Your workspace</h2>
					<NavWorkspace />
				</div>
				<div>
					<FeedView />
				</div>
			</div>
		</div>
	);
}
