"use client";

import {
	DndContext,
	type DragEndEvent,
	type DragOverEvent,
	DragOverlay,
	type DragStartEvent,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import type { RouterOutputs } from "@mimir/trpc";
import { Button } from "@ui/components/ui/button";
import {
	addDays,
	addMonths,
	endOfMonth,
	endOfWeek,
	format,
	isSameMonth,
	isToday,
	parseISO,
	startOfMonth,
	startOfWeek,
	subMonths,
} from "date-fns";
import { ChevronLeftIcon, ChevronRightIcon, ListPlusIcon } from "lucide-react";
import { useMemo, useState } from "react";
import Loader from "../../loader";
import { TaskContextMenu } from "../../task-context-menu";
import { useTasksViewContext } from "../tasks-view";
import { CalendarDayDroppable } from "./calendar-day";
import { CalendarTask, DraggableCalendarTask } from "./calendar-task";
import { useCalendarDnd, useCalendarDndStore } from "./use-calendar-dnd";

type CalendarTaskData = RouterOutputs["tasks"]["get"]["data"][number];

export const TasksCalendar = () => {
	const { tasks, fetchNextPage, hasNextPage, isLoading } =
		useTasksViewContext();
	const [currentDate, setCurrentDate] = useState(new Date());
	const { updateTaskDueDate } = useCalendarDnd();
	const { activeTask, setActiveTask, setOverDate } = useCalendarDndStore();

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
	);

	// Get calendar days for the current month view
	const calendarDays = useMemo(() => {
		const monthStart = startOfMonth(currentDate);
		const monthEnd = endOfMonth(currentDate);
		const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
		const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

		const days: Date[] = [];
		let day = startDate;

		while (day <= endDate) {
			days.push(day);
			day = addDays(day, 1);
		}

		return days;
	}, [currentDate]);

	// Group tasks by their due date
	const tasksByDate = useMemo(() => {
		const grouped = new Map<string, CalendarTaskData[]>();

		for (const task of tasks) {
			if (task.dueDate) {
				const dateKey = format(new Date(task.dueDate), "yyyy-MM-dd");
				const existing = grouped.get(dateKey) || [];
				grouped.set(dateKey, [...existing, task]);
			}
		}

		return grouped;
	}, [tasks]);

	const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
	const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
	const goToToday = () => setCurrentDate(new Date());

	const handleDragStart = (event: DragStartEvent) => {
		const taskId = event.active.id as string;
		const task = tasks.find((t) => t.id === taskId);
		if (task) {
			setActiveTask(task);
		}
	};

	const handleDragOver = (event: DragOverEvent) => {
		const overId = event.over?.id as string | undefined;
		setOverDate(overId || null);
	};

	const handleDragEnd = async (event: DragEndEvent) => {
		const { active, over } = event;

		setActiveTask(null);
		setOverDate(null);

		if (!over) return;

		const taskId = active.id as string;
		const newDateKey = over.id as string;

		// Parse the date from the droppable ID (format: yyyy-MM-dd)
		const newDueDate = parseISO(newDateKey);

		await updateTaskDueDate(taskId, newDueDate);
	};

	const handleDragCancel = () => {
		setActiveTask(null);
		setOverDate(null);
	};

	const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

	return (
		<DndContext
			sensors={sensors}
			onDragStart={handleDragStart}
			onDragOver={handleDragOver}
			onDragEnd={handleDragEnd}
			onDragCancel={handleDragCancel}
		>
			<div className="flex grow-1 flex-col">
				{/* Calendar Header */}
				<div className="flex items-center justify-between border-b px-4 py-3">
					<div className="flex items-center gap-2">
						<h2 className="font-semibold text-lg">
							{format(currentDate, "MMMM yyyy")}
						</h2>
					</div>
					<div className="flex items-center gap-2">
						<Button variant="outline" size="sm" onClick={goToToday}>
							Today
						</Button>
						<Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
							<ChevronLeftIcon className="size-4" />
						</Button>
						<Button variant="ghost" size="icon" onClick={goToNextMonth}>
							<ChevronRightIcon className="size-4" />
						</Button>
					</div>
				</div>

				{/* Week Day Headers */}
				<div className="grid grid-cols-7 border-b bg-muted/50">
					{weekDays.map((day) => (
						<div
							key={day}
							className="px-2 py-2 text-center font-medium text-muted-foreground text-xs"
						>
							{day}
						</div>
					))}
				</div>

				{/* Calendar Grid */}
				<div className="grid flex-1 grid-cols-7 overflow-auto">
					{calendarDays.map((day, index) => {
						const dateKey = format(day, "yyyy-MM-dd");
						const dayTasks = tasksByDate.get(dateKey) || [];
						const isCurrentMonth = isSameMonth(day, currentDate);
						const isDayToday = isToday(day);

						return (
							<CalendarDayDroppable
								key={dateKey}
								dateKey={dateKey}
								day={day}
								isCurrentMonth={isCurrentMonth}
								isDayToday={isDayToday}
								isLastColumn={index % 7 === 6}
							>
								{dayTasks.slice(0, 3).map((task) => (
									<TaskContextMenu key={task.id} task={task}>
										<div>
											<DraggableCalendarTask task={task} />
										</div>
									</TaskContextMenu>
								))}
								{dayTasks.length > 3 && (
									<span className="px-1 text-muted-foreground text-xs">
										+{dayTasks.length - 3} more
									</span>
								)}
							</CalendarDayDroppable>
						);
					})}
				</div>

				{/* Load More */}
				{hasNextPage && (
					<div className="flex items-center justify-center border-t p-2">
						<Button
							type="button"
							size="sm"
							variant="ghost"
							disabled={isLoading}
							onClick={() => fetchNextPage()}
						>
							{isLoading ? <Loader /> : <ListPlusIcon />}
							Load more tasks
						</Button>
					</div>
				)}
			</div>

			{/* Drag Overlay */}
			<DragOverlay>
				{activeTask && <CalendarTask task={activeTask} isDragging />}
			</DragOverlay>
		</DndContext>
	);
};
