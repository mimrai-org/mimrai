"use client";

import { useDroppable } from "@dnd-kit/core";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useCalendarDndStore } from "./use-calendar-dnd";

interface CalendarDayDroppableProps {
	dateKey: string;
	day: Date;
	isCurrentMonth: boolean;
	isDayToday: boolean;
	isLastColumn: boolean;
	children: React.ReactNode;
}

export const CalendarDayDroppable = ({
	dateKey,
	day,
	isCurrentMonth,
	isDayToday,
	isLastColumn,
	children,
}: CalendarDayDroppableProps) => {
	const { setNodeRef, isOver } = useDroppable({
		id: dateKey,
	});
	const { activeTask } = useCalendarDndStore();

	return (
		<div
			ref={setNodeRef}
			className={cn(
				"min-h-28 border-r border-b p-1 transition-colors",
				!isCurrentMonth ? "bg-muted/30" : "bg-background",
				isLastColumn && "border-r-0",
				isOver && activeTask && "bg-primary/10 ring-2 ring-primary ring-inset",
			)}
		>
			{/* Day Number */}
			<div className="mb-1 flex items-center justify-between">
				<span
					className={cn(
						"flex size-7 items-center justify-center rounded-full text-sm",
						isDayToday && "bg-primary font-semibold text-primary-foreground",
						!isDayToday && isCurrentMonth && "text-foreground",
						!isDayToday && !isCurrentMonth && "text-muted-foreground",
					)}
				>
					{format(day, "d")}
				</span>
			</div>

			{/* Tasks for this day */}
			<div className="flex flex-col gap-0.5 overflow-hidden">{children}</div>
		</div>
	);
};
