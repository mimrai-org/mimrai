import { redirect } from "next/navigation";
import { BreadcrumbSetter } from "@/components/breadcrumbs";
import { TasksView } from "@/components/tasks-view/tasks-view";
import { trpcClient } from "@/utils/trpc";

interface Props {
	params: Promise<{ projectId: string; team: string; viewId: string }>;
}

export default async function Page({ params }: Props) {
	const { projectId, team, viewId } = await params;

	const view = await trpcClient.taskViews.getById.query({
		id: viewId,
	});

	if (!view) {
		return redirect(`/team/${team}/projects/${projectId}`);
	}

	return (
		<div>
			<BreadcrumbSetter
				crumbs={[
					{
						label: view.name,
						segments: ["projects", projectId, "views", viewId],
					},
				]}
			/>
			<TasksView
				viewType={(view?.viewType as "list") || "list"}
				viewId={view?.id}
				showEmptyColumns
				{...view?.filters}
				projectId={[projectId]}
			/>
		</div>
	);
}
