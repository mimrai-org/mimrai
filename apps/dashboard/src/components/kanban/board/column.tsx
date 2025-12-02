"use client";

import { Badge } from "@mimir/ui/badge";
import { Button } from "@mimir/ui/button";
import * as Kanban from "@mimir/ui/kanban";
import { GripVertical, PlusIcon } from "lucide-react";
// UI & Logic
import { useTaskParams } from "@/hooks/use-task-params";
import { cn } from "@/lib/utils";
import { queryClient, trpc } from "@/utils/trpc";

// Local Components
import { ColumnIcon } from "../../column-icon";
import { ColumnContextMenu } from "./../column-context-menu";
import { KanbanTask } from "../kanban-task/kanban-task";
import { TaskContextMenu } from "./../task-context-menu";
import { type Column, type Task, useKanbanStore } from "./use-kanban-board"; // The hook we created above

interface BoardColumnProps {
	column: Column;
	columnName: string;
	tasks: Task[];
}

export function BoardColumn({ column, columnName, tasks }: BoardColumnProps) {
	const { overColumnName, activeTaskId } = useKanbanStore();
	const { setParams: setTaskParams } = useTaskParams();

	return (
		<Kanban.Column
			className="min-h-[200px] min-w-72 max-w-86 grow-1 rounded-sm"
			value={columnName}
		>
			<ColumnContextMenu column={column}>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Badge
							variant="secondary"
							className={cn(
								"pointer-events-none space-x-1 rounded-none bg-transparent text-sm",
								{ "text-muted-foreground": tasks.length === 0 },
							)}
						>
							<ColumnIcon className="size-4!" type={column.type} />
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
									taskColumnId: column.id,
								});
							}}
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
			<div className="h-[calc(100vh-195px)] grow-1 overflow-y-auto">
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
									taskColumnId: column.id,
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
