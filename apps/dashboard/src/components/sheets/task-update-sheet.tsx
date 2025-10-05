"use client";
import { useQuery } from "@tanstack/react-query";
import { useTaskParams } from "@/hooks/use-task-params";
import { trpc } from "@/utils/trpc";
import { TaskAttachments } from "../forms/task-form/attachments";
import { TaskForm } from "../forms/task-form/task-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "../ui/sheet";
import { Skeleton } from "../ui/skeleton";

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
			},
		),
	);

	return (
		<Dialog open={isOpen} onOpenChange={() => setParams({ taskId: null })}>
			<DialogHeader>
				<DialogTitle />
			</DialogHeader>
			<DialogContent showCloseButton={false} className="p-0 sm:min-w-[60%]">
				{task ? (
					<TaskForm
						defaultValues={{
							id: task.id,
							title: task.title,
							description: task.description || "",
							assigneeId: task.assigneeId || undefined,
							columnId: task.columnId,
							teamId: task.teamId,
							priority: task.priority || "medium",
							dueDate: task.dueDate || undefined,
							attachments: task.attachments || [],
						}}
					/>
				) : (
					<Skeleton className="h-[800px] w-full" />
				)}
			</DialogContent>
		</Dialog>
	);
};
