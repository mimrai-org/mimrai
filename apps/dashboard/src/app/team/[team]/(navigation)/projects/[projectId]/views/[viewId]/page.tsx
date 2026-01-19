import { redirect } from "next/navigation";
import { BreadcrumbSetter } from "@/components/breadcrumbs";
import { TasksView } from "@/components/tasks-view/tasks-view";
import { DEFAULT_VIEWS } from "@/components/views/default-views";
import { trpcClient } from "@/utils/trpc";

interface Props {
	params: Promise<{ projectId: string; team: string; viewId: string }>;
}

export default async function Page({ params }: Props) {
	const { projectId, team, viewId } = await params;

	const view =
		(await trpcClient.taskViews.getById.query({
			id: viewId,
		})) ??
		DEFAULT_VIEWS.find((v) => v.id === viewId) ??
		null;

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
				defaultFilters={{
					...view?.filters,
				}}
				id={view?.id}
				projectId={projectId}
			/>
		</div>
	);
}
