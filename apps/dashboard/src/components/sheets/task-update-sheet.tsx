"use client";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@mimir/ui/dialog";
import { Skeleton } from "@mimir/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@ui/lib/utils";
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
			<DialogContent
				showCloseButton={true}
				overlayClassName="hidden pointer-events-none"
				className={cn(
					"right-8 bottom-0 left-auto max-h-[85vh] translate-x-0 overflow-y-auto rounded-b-none pt-0 sm:min-w-[800px]",
					"translate-y-48 data-[state=closed]:translate-y-48 data-[state=open]:translate-y-0",
					"border-x border-t shadow-2xl shadow-secondary/10",
				)}
			>
				<DialogHeader className="hidden">
					<DialogTitle />
				</DialogHeader>
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
