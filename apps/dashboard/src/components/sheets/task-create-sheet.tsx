"use client";
import { useTaskParams } from "@/hooks/use-task-params";
import { TaskForm } from "../forms/task-form/task-form";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "../ui/sheet";

export const TaskCreateSheet = () => {
	const { createTask, taskColumnId, setParams } = useTaskParams();

	const isOpen = Boolean(createTask);

	return (
		<Dialog open={isOpen} onOpenChange={() => setParams(null)}>
			<DialogHeader>
				<DialogTitle />
			</DialogHeader>
			<DialogContent className="sm:min-w-[80%]">
				<TaskForm
					defaultValues={{
						columnId: taskColumnId || "backlog",
					}}
				/>
			</DialogContent>
		</Dialog>
	);
};
