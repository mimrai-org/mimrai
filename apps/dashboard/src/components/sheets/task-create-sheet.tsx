"use client";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@mimir/ui/dialog";
import { useTaskParams } from "@/hooks/use-task-params";
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

	return (
		<Dialog open={isOpen} onOpenChange={() => setParams(null)}>
			<DialogHeader>
				<DialogTitle />
			</DialogHeader>
			<DialogContent className="sm:min-w-[1000px]" showCloseButton={false}>
				<TaskForm
					defaultValues={{
						statusId: taskStatusId || "backlog",
						projectId: taskProjectId || undefined,
						milestoneId: taskMilestoneId || undefined,
					}}
				/>
			</DialogContent>
		</Dialog>
	);
};
