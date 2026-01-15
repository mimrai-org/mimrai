import { TasksView } from "@/components/tasks-view/tasks-view";

type Props = {
	params: Promise<{ projectId: string; team: string }>;
};

export default async function Page({ params }: Props) {
	const { projectId, team } = await params;
	return (
		<div>
			<TasksView projectId={[projectId]} viewType="list" showEmptyColumns />
		</div>
	);
}
