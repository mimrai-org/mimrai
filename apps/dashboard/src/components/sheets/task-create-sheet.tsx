"use client";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@mimir/ui/dialog";
import { useTaskParams } from "@/hooks/use-task-params";
import { TaskForm } from "../forms/task-form/task-form";

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
