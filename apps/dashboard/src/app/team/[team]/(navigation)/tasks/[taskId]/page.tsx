import { TaskForm } from "@/components/forms/task-form/form";
import { trpcClient } from "@/utils/trpc";

type Props = {
	params: Promise<{ taskId: string }>;
};

export default async function Page({ params }: Props) {
	const { taskId } = await params;

	const task = await trpcClient.tasks.getById.query({
		id: taskId,
	});

	return (
		<div className="mx-auto max-w-5xl">
			{/* <WorkSession task={task} /> */}
			<TaskForm
				defaultValues={{ ...task, labels: task?.labels?.map((l) => l.id) }}
			/>
		</div>
	);
}
