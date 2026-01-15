import { SunIcon } from "lucide-react";
import { NavTopTasks } from "@/components/nav/nav-top-tasks";
import { NavWorkspace } from "@/components/nav/nav-workspace";
import { NavSearch } from "@/components/nav-search";
import { ProjectsList } from "@/components/projects/list";
import { TeamSwitcher } from "@/components/team-switcher";
import { getSession } from "@/lib/get-session";

type Props = {
	searchParams: Promise<{
		[key: string]: string | string[] | undefined;
	}>;
};

export default async function Page({ searchParams }: Props) {
	const session = await getSession();

	return (
		<div className="flex h-screen w-screen flex-col items-center justify-center pb-4">
			<div className="max-w-4xl animate-blur-in space-y-8">
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
	);
}
