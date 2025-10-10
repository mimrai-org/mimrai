"use client";
import { useTaskParams } from "@/hooks/use-task-params";
import { TaskForm } from "../forms/task-form/task-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

export const TaskCreateSheet = () => {
	const { createTask, taskColumnId, setParams } = useTaskParams();

	const isOpen = Boolean(createTask);

	return (
		<Dialog open={isOpen} onOpenChange={() => setParams(null)}>
			<DialogHeader>
				<DialogTitle />
			</DialogHeader>
			<DialogContent className="sm:min-w-[1000px]">
				<TaskForm
					defaultValues={{
						columnId: taskColumnId || "backlog",
					}}
				/>
			</DialogContent>
		</Dialog>
	);
};
