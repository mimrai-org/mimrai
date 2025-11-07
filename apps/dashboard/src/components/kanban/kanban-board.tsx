"use client";

import type { RouterOutputs } from "@mimir/api/trpc";
import { Badge } from "@mimir/ui/badge";
import { Button } from "@mimir/ui/button";
import * as Kanban from "@mimir/ui/kanban";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GripVertical, PlusIcon } from "lucide-react";
import { AnimatePresence } from "motion/react";
import * as React from "react";
import { useColumnParams } from "@/hooks/use-column-params";
import { useTaskParams } from "@/hooks/use-task-params";
import { useTasksFilterParams } from "@/hooks/use-tasks-filter-params";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { ColumnIcon } from "../column-icon";
import { ColumnContextMenu } from "./column-context-menu";
import { KanbanTask } from "./kanban-task/kanban-task";
import { TaskContextMenu } from "./task-context-menu";
import { TasksFilters } from "./tasks-filters";

export function KanbanBoard() {
	const queryClient = useQueryClient();
	const { setParams } = useTaskParams();
	const { setParams: setColumnParams } = useColumnParams();
	const { ...filters } = useTasksFilterParams();
	const { data: columns } = useQuery(
		trpc.columns.get.queryOptions({
			type: ["in_progress", "review", "done"],
		}),
	);

	const queryKey = {
		assigneeId: filters.assigneeId ?? undefined,
		search: filters.search ?? undefined,
		labels: filters.labels ?? undefined,
		pageSize: 100,
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

	// const [kanbanState, setKanbanState] = React.useState(columnsData);

	// React.useEffect(() => {
	// 	console.log("Updating kanban state");
	// 	setKanbanState(columnsData);
	// }, [columnsData]);

	// React.useEffect(() => {
	// 	console.log("Kanban state changed:", kanbanState);
	// }, [kanbanState]);

	return (
		<div className="h-full grow-1">
			<div className="flex justify-between pb-4">
				<TasksFilters />
			</div>
			<Kanban.Root
				value={columnsData}
				// onValueChange={setKanbanState}
				onDragCancel={async ({ active, over }) => {
					return;
				}}
				onDragOver={async ({ active, over }) => {
					return;
				}}
				onDragEnd={async ({ active, over }) => {
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
							const prevOverItemOrder = Math.max(
								0,
								...tasks.data
									.filter(
										(task) =>
											task.columnId === overItem.columnId &&
											task.order < overItem.order,
									)
									.map((task) => task.order),
							);
							const nextOverItemOrder = Math.min(
								74000,
								...tasks.data
									.filter(
										(task) =>
											task.columnId === overItem.columnId &&
											task.order > overItem.order,
									)
									.map((task) => task.order),
							);

							const newActiveItem = { ...activeItem };
							const newOverItem = { ...overItem };

							newActiveItem.columnId = overItem.columnId;
							newActiveItem.order = overItem.order;
							if (activeItem.order < overItem.order) {
								// Moving down
								newActiveItem.order = (nextOverItemOrder + overItem.order) / 2;
							} else {
								// Moving up
								newActiveItem.order = (prevOverItemOrder + overItem.order) / 2;
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
							newActiveItem.order = 64000;

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
				<AnimatePresence>
					<Kanban.Board className="flex w-full items-stretch gap-4 overflow-x-auto">
						{Object.entries(columnsData).map(([columnValue, tasks]) => {
							const column = columns?.data.find(
								(col) => col.name === columnValue,
							);
							if (!column) return null;

							return (
								<Kanban.Column
									className="h-auto min-h-[200px] min-w-86 max-w-86 grow-1"
									key={columnValue}
									value={columnValue}
								>
									<ColumnContextMenu column={column}>
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<Badge
													variant="secondary"
													className={cn(
														"pointer-events-none space-x-1 rounded-none bg-transparent text-sm",
														{
															"text-muted-foreground": tasks.length === 0,
														},
													)}
												>
													<ColumnIcon className="size-4!" type={column.type} />
													<span>{tasks.length}</span>
												</Badge>
												<span className="font-medium text-sm">
													{columnValue}
												</span>
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
													<KanbanTask task={task} />
												</Kanban.Item>
											</TaskContextMenu>
										))}
									</div>
								</Kanban.Column>
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
