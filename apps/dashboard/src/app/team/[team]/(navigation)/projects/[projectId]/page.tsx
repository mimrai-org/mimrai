import { FolderOpen } from "lucide-react";
import { BreadcrumbSetter } from "@/components/breadcrumbs";
import { TasksView } from "@/components/tasks-view/tasks-view";
import { trpcClient } from "@/utils/trpc";

type Props = {
	params: Promise<{ projectId: string; team: string }>;
};

export default async function Page({ params }: Props) {
	const { projectId, team } = await params;

	const project = await trpcClient.projects.getById.query({
		id: projectId,
	});

	const defaultView = await trpcClient.taskViews.getDefault.query({
		projectId,
	});

	return (
		<div className="h-full">
			<BreadcrumbSetter
				crumbs={[
					{
						label: project.name,
						segments: ["projects", project.id],
					},
				]}
			/>
			<TasksView
				defaultFilters={{
					...defaultView?.filters,
				}}
				id={defaultView?.id}
				projectId={projectId}
			/>
		</div>
	);
}
