"use client";

import type { RouterOutputs } from "@mimir/api/trpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FlagIcon, GripVertical, PlusIcon } from "lucide-react";
import { AnimatePresence } from "motion/react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import * as Kanban from "@/components/ui/kanban";
import { useColumnParams } from "@/hooks/use-column-params";
import { useTaskParams } from "@/hooks/use-task-params";
import { useTasksFilterParams } from "@/hooks/use-tasks-filter-params";
import { trpc } from "@/utils/trpc";
import { ColumnContextMenu } from "./column-context-menu";
import { TaskGrid } from "./grid";
import { KanbanTask } from "./kanban-task";
import { TaskContextMenu } from "./task-context-menu";
import { TasksFilters } from "./tasks-filters";

export function KanbanBoard() {
	const queryClient = useQueryClient();
	const { setParams } = useTaskParams();
	const { setParams: setColumnParams } = useColumnParams();
	const { ...filters } = useTasksFilterParams();
	const { data: columns } = useQuery(
		trpc.columns.get.queryOptions({
			type: ["normal", "done"],
		}),
	);

	const queryKey = {
		assigneeId: filters.assigneeId ?? undefined,
		search: filters.search ?? undefined,
		labels: filters.labels ?? undefined,
		view: "board" as const,
	};

	const { data: tasks } = useQuery(
		trpc.tasks.get.queryOptions(queryKey, {
			placeholderData: (prev) => prev,
		}),
	);

	const { mutateAsync: updateTask } = useMutation(
		trpc.tasks.update.mutationOptions(),
	);

	const { mutateAsync: updateColumn } = useMutation(
		trpc.columns.update.mutationOptions(),
	);

	const columnsData = React.useMemo(() => {
		if (!tasks?.data || !columns?.data) return {};
		const sortedColumns = [...columns.data].sort((a, b) => a.order - b.order);
		const sortedTasks = [...tasks.data].sort((a, b) => a.order - b.order);

		return sortedColumns.reduce(
			(acc, column) => {
				acc[column.name] = sortedTasks.filter(
					(task) => task.columnId === column.id,
				);
				return acc;
			},
			{} as Record<string, RouterOutputs["tasks"]["get"]["data"]>,
		);
	}, [tasks?.data, columns?.data]);

	return (
		<div className="h-full grow-1">
			<div className="flex justify-between pb-4">
				<TasksFilters />
				<Button
					size={"sm"}
					onClick={() => setColumnParams({ createColumn: true })}
				>
					<PlusIcon />
					Add Column
				</Button>
			</div>
			<Kanban.Root
				value={columnsData}
				onMove={async ({ active, over }) => {
					if (!tasks) return;

					const activeColumn = columns?.data.find(
						(col) => col.name === active.id,
					);
					const overColumn = columns?.data.find((col) => col.name === over?.id);

					// Moving columns
					if (activeColumn && overColumn) {
						const tempOrder = activeColumn.order;
						activeColumn.order = overColumn.order;
						overColumn.order = tempOrder;

						// Update both columns
						await Promise.all([
							updateColumn({
								id: activeColumn.id,
								order: activeColumn.order,
							}),
							updateColumn({
								id: overColumn.id,
								order: overColumn.order,
							}),
						]);
						queryClient.invalidateQueries(trpc.tasks.get.queryOptions());
						queryClient.invalidateQueries(trpc.columns.get.queryOptions());

						return;
					}

					if (active.id !== over?.id) {
						const activeItem = tasks.data.find((task) => task.id === active.id);
						const overItem = tasks.data.find((task) => task.id === over?.id);

						if (activeItem && overItem) {
							const newActiveItem = { ...activeItem };
							const newOverItem = { ...overItem };

							newActiveItem.columnId = overItem.columnId;
							newActiveItem.order = overItem.order;
							if (activeItem.order < overItem.order) {
								newOverItem.order = overItem.order - 1;
							} else {
								newOverItem.order = overItem.order + 1;
							}

							queryClient.setQueryData(
								trpc.tasks.get.queryKey(queryKey),
								(old) => {
									if (!old) return old;
									const newData = {
										...old,
										data: [...old.data]
											.map((task) => {
												if (task.id === activeItem.id) return newActiveItem;
												if (task.id === overItem.id) return newOverItem;
												return task;
											})
											.sort((a, b) => a.order - b.order),
									};
									return newData;
								},
							);
							await Promise.all([
								updateTask({
									id: newActiveItem.id,
									columnId: newActiveItem.columnId,
									order: newActiveItem.order,
								}),
								updateTask({
									id: newOverItem.id,
									order: newOverItem.order,
								}),
							]);
							// queryClient.invalidateQueries(trpc.tasks.get.queryOptions());
						} else if (activeItem && !overItem) {
							// Moving to empty column
							const overColumnId = columns?.data.find(
								(col) => col.name === over?.id,
							)?.id;

							if (!overColumnId) return;
							const newActiveItem = { ...activeItem };
							newActiveItem.columnId = overColumnId;
							newActiveItem.order = 50;

							queryClient.setQueryData(
								trpc.tasks.get.queryKey(queryKey),
								(old) => {
									if (!old) return undefined;
									const newData = {
										...old,
										data: [...old.data]
											.map((task) => {
												if (task.id === activeItem.id) return newActiveItem;
												return task;
											})
											.sort((a, b) => a.order - b.order),
									};
									return newData;
								},
							);

							await updateTask({
								id: newActiveItem.id,
								columnId: newActiveItem.columnId,
								order: newActiveItem.order,
							});
							// queryClient.invalidateQueries(trpc.tasks.get.queryOptions());
						}
					}
				}}
				getItemValue={(item) => item.id}
			>
				<Kanban.Board className="flex w-full gap-4 overflow-x-auto">
					{Object.entries(columnsData).map(([columnValue, tasks]) => {
						const column = columns?.data.find(
							(col) => col.name === columnValue,
						);
						if (!column) return null;

						return (
							<Kanban.Column
								className="min-h-[200px] max-w-86 grow-1 bg-accent/10"
								key={columnValue}
								value={columnValue}
							>
								<ColumnContextMenu column={column}>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<Badge
												variant="outline"
												className="pointer-events-none rounded-sm"
											>
												{column.type === "done" && (
													<FlagIcon className="size-4" />
												)}
												{tasks.length}
											</Badge>
											<span className="font-medium text-sm">{columnValue}</span>
										</div>
										<div className="flex items-center gap-2">
											<Button
												size={"sm"}
												variant={"ghost"}
												onClick={() =>
													setParams({
														createTask: true,
														taskColumnId:
															columns?.data.find(
																(col) => col.name === columnValue,
															)?.id || null,
													})
												}
											>
												<PlusIcon />
											</Button>
											<Kanban.ColumnHandle asChild>
												<Button variant="ghost" size="icon">
													<GripVertical className="h-4 w-4" />
												</Button>
											</Kanban.ColumnHandle>
										</div>
									</div>
								</ColumnContextMenu>
								<div className="flex flex-col gap-2 p-0.5">
									<AnimatePresence>
										{tasks.map((task) => (
											<TaskContextMenu task={task} key={task.id}>
												<Kanban.Item
													value={task.id}
													asHandle
													asChild
													onClick={(e) => {
														e.preventDefault();
														e.stopPropagation();
														queryClient.setQueryData(
															trpc.tasks.getById.queryKey({ id: task.id }),
															task,
														);
														setParams({ taskId: task.id });
													}}
												>
													<KanbanTask
														task={task}
														// className="border-b-0 last:border-b"
													/>
												</Kanban.Item>
											</TaskContextMenu>
										))}
									</AnimatePresence>
								</div>
							</Kanban.Column>
						);
					})}
				</Kanban.Board>
				<Kanban.Overlay>
					<div className="size-full bg-primary/10" />
				</Kanban.Overlay>
			</Kanban.Root>
		</div>
	);
}
