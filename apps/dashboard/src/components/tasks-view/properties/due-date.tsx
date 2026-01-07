import { cn } from "@ui/lib/utils";
import { differenceInDays, format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { Task } from "./task-properties";

export const TaskPropertyDueDate = ({
	task,
}: {
	task: Pick<Task, "dueDate">;
}) => {
	if (!task.dueDate) {
		return null;
	}

	const isDueSoon =
		differenceInDays(new Date(task.dueDate || ""), new Date()) <= 3;
	const isOverdue = task.dueDate ? new Date(task.dueDate) < new Date() : false;

	return (
		<time
			className={cn(
				"flex h-5.5 items-center gap-1 rounded-sm bg-secondary px-2 text-xs tabular-nums",
			)}
		>
			<CalendarIcon
				className={cn("size-3.5 text-muted-foreground", {
					"text-yellow-500": isDueSoon && !isOverdue,
					"text-red-500": isOverdue,
				})}
			/>
			{format(new Date(task.dueDate), "PP")}
		</time>
	);
};
