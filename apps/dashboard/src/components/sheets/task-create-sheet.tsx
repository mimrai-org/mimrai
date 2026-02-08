"use client";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@mimir/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { useTaskParams } from "@/hooks/use-task-params";
import { trpc } from "@/utils/trpc";
import { TaskForm } from "../forms/task-form/form";

export const TaskCreateSheet = () => {
	const {
		createTask,
		taskStatusId,
		taskProjectId,
		taskMilestoneId,
		setParams,
	} = useTaskParams();

	const isOpen = Boolean(createTask);

	const { data: todoStatus } = useQuery(
		trpc.statuses.get.queryOptions(
			{ type: ["to_do"], pageSize: 1 },
			{
				select: (data) => data.data[0],
				refetchOnMount: false,
				refetchOnWindowFocus: false,
			},
		),
	);

	return (
		<Dialog open={isOpen} onOpenChange={() => setParams(null)}>
			<DialogHeader>
				<DialogTitle />
			</DialogHeader>
			<DialogContent
				onPointerDownOutside={(e) => e.preventDefault()}
				onInteractOutside={(e) => e.preventDefault()}
				className="max-h-[85vh] overflow-y-auto pt-0 sm:min-w-[1000px]"
			>
				<TaskForm
					defaultValues={{
						statusId: taskStatusId || todoStatus?.id || "backlog",
						projectId: taskProjectId || undefined,
						milestoneId: taskMilestoneId || undefined,
					}}
				/>
			</DialogContent>
		</Dialog>
	);
};
