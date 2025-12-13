import { TasksView } from "@/components/tasks-view/tasks-view";

type Props = {
	params: Promise<{ projectId: string }>;
};

export default async function Page({ params }: Props) {
	const { projectId } = await params;

	return (
		<TasksView
			viewType={"list"}
			projectId={[projectId]}
			showEmptyColumns={false}
		/>
	);
}
