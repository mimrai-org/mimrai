"use client";
import { useQuery } from "@tanstack/react-query";
import { useTaskParams } from "@/hooks/use-task-params";
import { trpc } from "@/utils/trpc";
import { TaskForm } from "../forms/task-form";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "../ui/sheet";

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
		<Sheet open={isOpen} onOpenChange={() => setParams({ taskId: null })}>
			<SheetContent className="sm:min-w-[900px]">
				<SheetHeader>
					<SheetTitle>Update Task</SheetTitle>
					<SheetDescription>Make changes to your task here.</SheetDescription>
				</SheetHeader>

				{task && (
					<TaskForm
						defaultValues={{
							id: task.id,
							title: task.title,
							description: task.description || "",
							assigneeId: task.assigneeId || undefined,
							columnId: task.columnId,
							teamId: task.teamId,
							dueDate: task.dueDate || undefined,
						}}
					/>
				)}
			</SheetContent>
		</Sheet>
	);
};
