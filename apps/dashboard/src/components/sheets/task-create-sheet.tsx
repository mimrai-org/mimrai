"use client";
import { useTaskParams } from "@/hooks/use-task-params";
import { TaskForm } from "../forms/task-form";
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
		<Sheet open={isOpen} onOpenChange={() => setParams(null)}>
			<SheetContent className="sm:min-w-[900px]">
				<SheetHeader>
					<SheetTitle>Create Task</SheetTitle>
					<SheetDescription>
						Create a new task for your project.
					</SheetDescription>
				</SheetHeader>

				<TaskForm
					defaultValues={{
						columnId: taskColumnId || "backlog",
					}}
				/>
			</SheetContent>
		</Sheet>
	);
};
