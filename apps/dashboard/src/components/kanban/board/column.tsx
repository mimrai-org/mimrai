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
			className="h-auto min-h-[200px] min-w-86 max-w-86 grow-1 bg-muted/10"
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
							<span>{tasks.length}</span>
						</Badge>
						<span className="font-medium text-sm">{columnName}</span>
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

			<div className="relative flex grow-1 flex-col gap-2">
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
				<div
					className={cn(
						"pointer-events-none absolute inset-0 flex items-center justify-center border bg-black/50 opacity-0 transition-opacity duration-200",
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
		</Kanban.Column>
	);
}
