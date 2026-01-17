"use client";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@ui/components/ui/dialog";
import { useTaskViewParams } from "@/hooks/use-task-view-params";
import { TaskViewForm } from "../forms/task-view/form";

export const TaskViewCreateSheet = () => {
	const {
		createTaskView,
		taskViewName,
		taskViewProjectId,
		taskViewDescription,
		taskViewType,
		setParams,
	} = useTaskViewParams();

	const isOpen = Boolean(createTaskView);

	return (
		<Dialog open={isOpen} onOpenChange={() => setParams(null)}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create Task View</DialogTitle>
				</DialogHeader>
				<TaskViewForm
					defaultValues={{
						name: taskViewName || "",
						description: taskViewDescription || "",
						projectId: taskViewProjectId,
						viewType: taskViewType || "list",
					}}
				/>
			</DialogContent>
		</Dialog>
	);
};
