import { BreadcrumbSetter } from "@/components/breadcrumbs";
import { TasksView } from "@/components/tasks-view/tasks-view";
import { trpcClient } from "@/utils/trpc";

type Props = {
	params: Promise<{ projectId: string; team: string }>;
};

export default async function Page({ params }: Props) {
	const { projectId, team } = await params;

	const defaultView = await trpcClient.taskViews.getDefault.query({
		projectId,
	});

	return (
		<div className="h-full animate-blur-in">
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
