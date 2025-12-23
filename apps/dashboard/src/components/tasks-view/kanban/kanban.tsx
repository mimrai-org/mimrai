"use client";

import * as Kanban from "@mimir/ui/kanban";
import { AnimatePresence } from "motion/react";
import { useMemo } from "react";
import { BoardColumn } from "./column";
import { type Task, useKanbanBoard, useKanbanStore } from "./use-kanban-board"; // The hook we created above

export function TasksBoard() {
	const { setActiveTaskId, setOverColumnName } = useKanbanStore();

	// Use our custom hook for logic
	const { boardData, reorderTask, columns } = useKanbanBoard();

	const formattedBoardData = useMemo(() => {
		if (!boardData) return {};
		return Object.entries(boardData).reduce(
			(acc, [columnName, { column, tasks }]) => {
				acc[columnName] = tasks;
				return acc;
			},
			{} as Record<string, Task[]>,
		);
	}, [boardData]);

	const columnsArray = useMemo(() => {
		if (!boardData) return [];
		return Object.entries(boardData).map(([columnName, { column, tasks }]) => {
			return { name: columnName, column, tasks };
		});
	}, [formattedBoardData]);

	return (
		<div className="flex h-full grow-1 flex-col p-2">
			<Kanban.Root
				value={formattedBoardData}
				getItemValue={(item) => item.id}
				onDragEnd={async ({ active, over }) => {
					if (!over) return;

					const isColumnDrag = columns?.some((col) => col.name === active.id);

					setActiveTaskId(undefined);
					setOverColumnName(undefined);

					if (isColumnDrag) {
						// await reorderColumn(active.id as string, over.id as string);
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

					const isTask = Object.keys(formattedBoardData).some((columnName) =>
						formattedBoardData[columnName]?.some((task) => task.id === overId),
					);
					if (isTask) {
						const columnName = Object.keys(formattedBoardData).find(
							(columnName) =>
								formattedBoardData[columnName]?.some(
									(task) => task.id === overId,
								),
						);
						setOverColumnName(columnName);
					}
				}}
			>
				<AnimatePresence mode="popLayout">
					<Kanban.Board className="flex items-stretch gap-4 overflow-x-auto p-2">
						{columnsArray.map(({ name: columnName, column, tasks }) => {
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
