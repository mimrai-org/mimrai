"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { RouterOutputs } from "@mimir/trpc";
import { useTaskPanel } from "@/components/panels/task-panel";
import { TaskProperty } from "@/components/tasks-view/properties/task-properties";
import { useTaskParams } from "@/hooks/use-task-params";
import { cn } from "@/lib/utils";
import { queryClient, trpc } from "@/utils/trpc";

export type CalendarTaskType = RouterOutputs["tasks"]["get"]["data"][number];

// Determine background color based on priority
const getPriorityColor = (priority: string | null) => {
	switch (priority) {
		case "urgent":
			return "bg-red-500/15 border-red-500/30 hover:bg-red-500/25";
		case "high":
			return "bg-orange-500/15 border-orange-500/30 hover:bg-orange-500/25";
		case "medium":
			return "bg-yellow-500/15 border-yellow-500/30 hover:bg-yellow-500/25";
		case "low":
			return "bg-blue-500/15 border-blue-500/30 hover:bg-blue-500/25";
		default:
			return "bg-muted/50 border-border hover:bg-muted";
	}
};

export const CalendarTask = ({
	task,
	className,
	isDragging,
}: {
	task: CalendarTaskType;
	className?: string;
	isDragging?: boolean;
}) => {
	const taskPanel = useTaskPanel();

	return (
		<button
			type="button"
			className={cn(
				"w-full cursor-pointer truncate rounded-sm border px-1.5 py-0.5 text-left text-xs transition-colors",
				getPriorityColor(task.priority),
				{
					"line-through opacity-50": task.status?.type === "done",
					"rotate-3 scale-105 shadow-lg": isDragging,
				},
				className,
			)}
			onClick={() => {
				taskPanel.open(task.id);
			}}
		>
			<div className="flex items-center gap-1">
				<TaskProperty property="status" task={task} />
				<span className="truncate">{task.title}</span>
			</div>
		</button>
	);
};

export const DraggableCalendarTask = ({
	task,
	className,
}: {
	task: CalendarTaskType;
	className?: string;
}) => {
	const taskPanel = useTaskPanel();
	const { attributes, listeners, setNodeRef, transform, isDragging } =
		useDraggable({
			id: task.id,
		});

	const style = transform
		? {
				transform: CSS.Translate.toString(transform),
			}
		: undefined;

	return (
		<button
			ref={setNodeRef}
			type="button"
			style={style}
			className={cn(
				"w-full cursor-grab truncate rounded-sm border px-1.5 py-0.5 text-left text-xs transition-colors active:cursor-grabbing",
				getPriorityColor(task.priority),
				{
					"line-through opacity-50": task.status?.type === "done",
					"opacity-50": isDragging,
				},
				className,
			)}
			onClick={() => {
				if (isDragging) return;
				taskPanel.open(task.id);
			}}
			{...listeners}
			{...attributes}
		>
			<div className="flex items-center gap-1">
				<TaskProperty property="status" task={task} />
				<span className="truncate">{task.title}</span>
			</div>
		</button>
	);
};
