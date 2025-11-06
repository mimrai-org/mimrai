"use client";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@mimir/ui/dialog";
import { Skeleton } from "@mimir/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { useTaskParams } from "@/hooks/use-task-params";
import { trpc } from "@/utils/trpc";
import { TaskForm } from "../forms/task-form/form";

export const TaskUpdateSheet = () => {
	const { taskId, setParams } = useTaskParams();

	const isOpen = Boolean(taskId);

	const { data: task } = useQuery(
		trpc.tasks.getById.queryOptions(
			{
				id: taskId!,
			},
			{
				enabled: isOpen,
				placeholderData: (old) => {
					if (!taskId) return old;
					if (taskId === old?.id) return old;
					return undefined;
				},
			},
		),
	);

	return (
		<Dialog open={isOpen} onOpenChange={() => setParams({ taskId: null })}>
			<DialogHeader>
				<DialogTitle />
			</DialogHeader>
			<DialogContent
				showCloseButton={true}
				className="max-h-[85vh] overflow-y-auto pt-0 sm:min-w-[60vw]"
			>
				{task ? (
					<TaskForm
						defaultValues={{
							...task,
							labels: task.labels?.map((label) => label.id) || [],
						}}
					/>
				) : (
					<Skeleton className="h-[200px] w-full" />
				)}
			</DialogContent>
		</Dialog>
	);
};
