"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { GripVertical, PlusIcon } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import * as Kanban from "@/components/ui/kanban";
import { useColumnParams } from "@/hooks/use-column-params";
import { useTaskParams } from "@/hooks/use-task-params";
import { queryClient, trpc } from "@/utils/trpc";

interface Task {
	id: string;
	title: string;
	priority: "low" | "medium" | "high";
	assignee?: string;
	dueDate: string | null;
}

export function KanbanBoard() {
	const { setParams } = useTaskParams();
	const { setParams: setColumnParams } = useColumnParams();
	const { data: columns } = useQuery(trpc.columns.get.queryOptions());
	const { data: tasks } = useQuery(trpc.tasks.get.queryOptions());
	const { mutateAsync: updateTask } = useMutation(
		trpc.tasks.update.mutationOptions(),
	);

	const columnsData = React.useMemo(() => {
		if (!tasks || !columns) return {};
		const sortedTasks = [...tasks.data].sort((a, b) => a.order - b.order);

		return columns.data.reduce(
			(acc, column) => {
				acc[column.name] = sortedTasks.filter(
					(task) => task.columnId === column.id,
				);
				return acc;
			},
			{} as Record<string, Task[]>,
		);

		// return sortedTasks.reduce(
		// 	(acc, task) => {
		// 		const column = task.column?.name || "backlog";
		// 		if (!acc[column]) {
		// 			acc[column] = [];
		// 		}
		// 		acc[column].push(task);
		// 		return acc;
		// 	},
		// 	{} as Record<string, Task[]>,
		// );
	}, [tasks, columns]);

	return (
		<div>
			<div className="flex justify-end pb-4">
				<Button onClick={() => setColumnParams({ createColumn: true })}>
					Add Column
				</Button>
			</div>
			<Kanban.Root
				value={columnsData}
				onMove={async ({ active, over }) => {
					if (!tasks) return;
					console.log({ active, over });
					if (active.id !== over?.id) {
						const activeItem = tasks.data.find((task) => task.id === active.id);
						const overItem = tasks.data.find((task) => task.id === over?.id);

						console.log({ activeItem, overItem });

						if (activeItem && overItem) {
							activeItem.columnId = overItem.columnId;
							const tempOrder = activeItem.order;
							activeItem.order = overItem.order;
							if (tempOrder <= overItem.order) {
								// Moving down
								overItem.order--;
							} else {
								// Moving up
								overItem.order++;
							}

							const newTasks = tasks.data.map((task) => {
								if (task.id === activeItem.id) return activeItem;
								if (task.id === overItem.id) return overItem;
								return task;
							});

							// console.log({ newTasks });

							// queryClient.setQueryData(
							// 	trpc.tasks.get.queryKey(),
							// 	(old: any) => ({
							// 		...old,
							// 		data: newTasks.sort((a, b) => a.order - b.order),
							// 	}),
							// );

							await updateTask({
								id: activeItem.id,
								columnId: activeItem.columnId,
								order: activeItem.order,
							});
							await updateTask({
								id: overItem.id,
								order: overItem.order,
							});
							queryClient.invalidateQueries(trpc.tasks.get.queryOptions());
						} else if (activeItem && !overItem) {
							// Moving to empty column
							const overColumnId = columns?.data.find(
								(col) => col.name === over?.id,
							)?.id;

							console.log({ overColumnId });
							if (!overColumnId) return;
							activeItem.columnId = overColumnId;
							activeItem.order = 0;
							await updateTask({
								id: activeItem.id,
								columnId: activeItem.columnId,
								order: activeItem.order,
							});
							queryClient.invalidateQueries(trpc.tasks.get.queryOptions());
						}
					}
				}}
				getItemValue={(item) => item.id}
			>
				<Kanban.Board className="grid auto-rows-fr sm:grid-cols-3">
					{Object.entries(columnsData).map(([columnValue, tasks]) => (
						<Kanban.Column key={columnValue} value={columnValue}>
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<span className="font-semibold text-sm">{columnValue}</span>
									<Badge
										variant="secondary"
										className="pointer-events-none rounded-sm"
									>
										{tasks.length}
									</Badge>
								</div>
								<div className="flex items-center gap-2">
									<Button
										size={"sm"}
										variant={"ghost"}
										onClick={() =>
											setParams({
												createTask: true,
												taskColumnId:
													columns?.data.find((col) => col.name === columnValue)
														?.id || null,
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
							<div className="flex flex-col gap-2 p-0.5">
								{tasks.map((task) => (
									<Kanban.Item key={task.id} value={task.id} asHandle asChild>
										<div className="border bg-card p-3">
											<div className="flex flex-col gap-2">
												<div className="flex items-center justify-between gap-2">
													<span className="line-clamp-1 font-medium text-sm">
														{task.title}
													</span>
													<Badge
														variant={
															task.priority === "high"
																? "destructive"
																: task.priority === "medium"
																	? "default"
																	: "secondary"
														}
														className="pointer-events-none h-5 rounded-sm px-1.5 text-[11px] capitalize"
													>
														{task.priority}
													</Badge>
												</div>
												<div className="flex items-center justify-between text-muted-foreground text-xs">
													{task.assignee && (
														<div className="flex items-center gap-1">
															<div className="size-2 rounded-full bg-primary/20" />
															<span className="line-clamp-1">
																{task.assignee}
															</span>
														</div>
													)}
													{task.dueDate && (
														<time className="text-[10px] tabular-nums">
															{task.dueDate}
														</time>
													)}
												</div>
											</div>
										</div>
									</Kanban.Item>
								))}
							</div>
						</Kanban.Column>
					))}
				</Kanban.Board>
				<Kanban.Overlay>
					<div className="size-full bg-primary/10" />
				</Kanban.Overlay>
			</Kanban.Root>
		</div>
	);
}
