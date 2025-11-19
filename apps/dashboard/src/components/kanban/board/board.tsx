"use client";

import * as Kanban from "@mimir/ui/kanban";
import { set } from "better-auth";
import { AnimatePresence } from "motion/react";
import { useTasksFilterParams } from "@/hooks/use-tasks-filter-params";
import { TasksFilters } from "./../tasks-filters";
import { BoardColumn } from "./column";
import { useKanbanBoard, useKanbanStore } from "./use-kanban-board"; // The hook we created above

export function Board() {
	const filters = useTasksFilterParams();
	const { setActiveTaskId, setOverColumnName } = useKanbanStore();

	// Use our custom hook for logic
	const { boardData, columns, reorderColumn, reorderTask } =
		useKanbanBoard(filters);

	const handleDragEnd = async ({
		active,
		over,
	}: {
		active: any;
		over: any;
	}) => {};

	return (
		<div className="flex h-full grow-1 flex-col">
			<div className="flex justify-between pb-4">
				<TasksFilters />
			</div>

			<Kanban.Root
				value={boardData}
				getItemValue={(item) => item.id}
				onDragEnd={async ({ active, over }) => {
					if (!over) return;

					const isColumnDrag = columns?.some((col) => col.name === active.id);

					setActiveTaskId(undefined);
					setOverColumnName(undefined);

					if (isColumnDrag) {
						await reorderColumn(active.id as string, over.id as string);
					} else {
						// It is a task drag
						// "over.id" might be a task ID, OR a column name (if dropping on empty column)
						await reorderTask(
							active.id as string,
							over.id as string,
							over.id as string,
						);
					}
				}}
				onDragStart={({ active }) => setActiveTaskId(active.id as string)}
				onDragCancel={() => {
					setActiveTaskId(undefined);
					setOverColumnName(undefined);
				}}
				onDragOver={({ over }) => {
					const overId = over?.id as string | undefined;
					const isColumn = columns?.some((col) => col.name === overId);
					if (isColumn) {
						setOverColumnName(overId);
						return;
					}

					const isTask = Object.keys(boardData).some((columnName) =>
						boardData[columnName]?.some((task) => task.id === overId),
					);
					if (isTask) {
						const columnName = Object.keys(boardData).find((columnName) =>
							boardData[columnName]?.some((task) => task.id === overId),
						);
						setOverColumnName(columnName);
					}
				}}
			>
				<AnimatePresence>
					<Kanban.Board className="flex items-stretch gap-4 overflow-x-auto">
						{Object.entries(boardData).map(([columnName, tasks]) => {
							const column = columns?.find((col) => col.name === columnName);
							if (!column) return null;

							return (
								<BoardColumn
									key={columnName}
									column={column}
									columnName={columnName}
									tasks={tasks}
								/>
							);
						})}
					</Kanban.Board>
				</AnimatePresence>

				<Kanban.Overlay>
					<div className="size-full bg-primary/10" />
				</Kanban.Overlay>
			</Kanban.Root>
		</div>
	);
}
