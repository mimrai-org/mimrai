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
				placeholderData: (prev) => prev,
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
				className="min-h-[80vh] pt-0 sm:min-w-[60vw]"
			>
				{task ? (
					<TaskForm
						defaultValues={{
							id: task.id,
							title: task.title,
							description: task.description || "",
							assigneeId: task.assigneeId || undefined,
							columnId: task.columnId,
							priority: task.priority || "medium",
							dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
							labels: task.labels?.map((label) => label.id) || [],
							attachments: task.attachments || [],
							recurring: task.recurring || undefined,
						}}
					/>
				) : (
					<Skeleton className="h-[200px] w-full" />
				)}
			</DialogContent>
		</Dialog>
	);
};
