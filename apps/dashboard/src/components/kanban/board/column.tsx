"use client";

import { Button } from "@mimir/ui/button";
import * as Kanban from "@mimir/ui/kanban";
import { Badge } from "@ui/components/ui/badge";
import { PlusIcon } from "lucide-react";
import type { GenericGroup } from "@/components/tasks-view/tasks-group";
// UI & Logic
import { useTaskParams } from "@/hooks/use-task-params";
import { cn } from "@/lib/utils";
import { queryClient, trpc } from "@/utils/trpc";
// Local Components
import { KanbanTask } from "../kanban-task/kanban-task";
import { TaskContextMenu } from "./../task-context-menu";
import { type Task, useKanbanStore } from "./use-kanban-board";

interface BoardColumnProps {
	column: GenericGroup;
	columnName: string;
	tasks: Task[];
}

export function BoardColumn({ column, columnName, tasks }: BoardColumnProps) {
	const { overColumnName, activeTaskId } = useKanbanStore();
	const { setParams: setTaskParams } = useTaskParams();

	return (
		<Kanban.Column
			className="min-h-[200px] min-w-86 max-w-86 grow-1 rounded-sm bg-gradient-to-b from-secondary/3 to-transparent"
			value={columnName}
		>
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Badge
						variant="secondary"
						className={cn(
							"pointer-events-none space-x-1 rounded-none bg-transparent text-sm",
							{ "text-muted-foreground": tasks.length === 0 },
						)}
					>
						{column.icon}
					</Badge>
					<span className="font-medium text-sm">{columnName}</span>
					<span className="font-mono text-muted-foreground text-xs">
						{tasks.length}
					</span>
				</div>

				<div className="flex items-center gap-2">
					<Button
						size="sm"
						variant="ghost"
						onClick={() => {
							setTaskParams({
								createTask: true,
								taskStatusId: column.id,
							});
						}}
					>
						<PlusIcon />
					</Button>
				</div>
			</div>
			<div className="max-h-[calc(100vh-220px)] grow-1 overflow-y-auto px-2">
				<div className="relative h-full space-y-2">
					{tasks.map((task) => (
						<TaskContextMenu task={task} key={task.id}>
							<Kanban.Item
								value={task.id}
								asHandle
								asChild
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();

									// Prefetch/Cache data before navigation
									queryClient.setQueryData(
										trpc.tasks.getById.queryKey({ id: task.id }),
										task,
									);
									setTaskParams({ taskId: task.id });
								}}
							>
								<KanbanTask task={task} />
							</Kanban.Item>
						</TaskContextMenu>
					))}

					<div>
						<Button
							className="w-full justify-start border border-transparent border-dashed text-start text-xs hover:border-input hover:bg-background/20!"
							variant={"ghost"}
							onClick={() => {
								setTaskParams({
									createTask: true,
									taskStatusId: column.id,
								});
							}}
						>
							<PlusIcon className="size-3.5" />
							Create Task
						</Button>
					</div>

					{/* Drag overlay */}
					<div
						className={cn(
							"pointer-events-none absolute inset-0 flex items-center justify-center rounded-sm border bg-black/80 opacity-0 backdrop-blur-none transition-opacity duration-200",
							{
								"opacity-100":
									overColumnName === columnName && Boolean(activeTaskId),
							},
						)}
					>
						<div className="text-xs">
							Drag here to move task to{" "}
							<strong className="border px-1 py-0.5">{columnName}</strong>
						</div>
					</div>
				</div>
			</div>
		</Kanban.Column>
	);
}
