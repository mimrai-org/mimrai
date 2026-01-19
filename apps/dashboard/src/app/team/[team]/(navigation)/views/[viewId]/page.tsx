import { notFound } from "next/navigation";
import { BreadcrumbSetter } from "@/components/breadcrumbs";
import { TasksView } from "@/components/tasks-view/tasks-view";
import { trpcClient } from "@/utils/trpc";

interface Props {
	params: Promise<{
		team: string;
		viewId: string;
	}>;
}

export default async function Page({ params }: Props) {
	const { viewId } = await params;
	const view = await trpcClient.taskViews.getById.query({
		id: viewId,
	});

	if (!view) {
		return notFound();
	}

	return (
		<div className="animate-blur-in">
			<BreadcrumbSetter
				crumbs={[
					{
						label: view.name,
						segments: ["views", view.id],
					},
				]}
			/>
			<TasksView
				defaultFilters={{
					...view.filters,
				}}
				id={view.id}
			/>
		</div>
	);
}
