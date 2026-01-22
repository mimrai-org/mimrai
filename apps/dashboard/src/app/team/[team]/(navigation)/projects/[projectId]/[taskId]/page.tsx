import { LayersIcon } from "lucide-react";
import { BreadcrumbSetter } from "@/components/breadcrumbs";
import { TaskForm } from "@/components/forms/task-form/form";
import { trpcClient } from "@/utils/trpc";

interface Props {
	params: Promise<{
		team: string;
		projectId: string;
		taskId: string;
	}>;
}

export default async function TaskPage({ params }: Props) {
	const { team, projectId, taskId } = await params;

	const task = await trpcClient.tasks.getById.query({
		id: taskId,
	});

	return (
		<div className="mx-auto max-w-6xl animate-blur-in">
			<BreadcrumbSetter
				crumbs={[
					{
						label: task.title,
						segments: ["projects", projectId, taskId],
					},
				]}
			/>
			<TaskForm
				defaultValues={{ ...task, labels: task?.labels?.map((l) => l.id) }}
			/>
		</div>
	);
}
