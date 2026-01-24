import {
	DndContext,
	PointerSensor,
	useDroppable,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { Button } from "@ui/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@ui/components/ui/collapsible";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "@ui/components/ui/context-menu";
import { cn } from "@ui/lib/utils";
import {
	CheckSquareIcon,
	ChevronDownIcon,
	ChevronRightIcon,
	ListPlusIcon,
	PlusIcon,
	SquareCheckIcon,
} from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useState } from "react";
import { useTaskParams } from "@/hooks/use-task-params";
import Loader from "../../loader";
import { TaskContextMenu } from "../../task-context-menu";
import { type GenericGroup, type Task, useTasksGrouped } from "../tasks-group";
import { useTasksViewContext } from "../tasks-view";
import { TaskListBulkActions } from "./bulk-actions";
import { TaskItem } from "./task-item";

export const TasksList = () => {
	const { fetchNextPage, hasNextPage, isLoading, filters } =
		useTasksViewContext();

	const { tasks, reorderTask } = useTasksGrouped();

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 5,
			},
		}),
	);

	return (
		<>
			<DndContext
				sensors={sensors}
				onDragEnd={async ({ active, over }) => {
					if (!over) return;

					// It is a task drag
					// "over.id" might be a task ID, OR a column name (if dropping on empty column)
					await reorderTask(
						active.id as string,
						over.id as string,
						over.id as string,
					);
				}}
			>
				<div className="flex flex-col gap-2 py-4">
					<AnimatePresence mode="popLayout">
						{Object.entries(tasks).map(([_, taskGroup]) => {
							return (
								<TaskGroupItem
									key={taskGroup.column.id}
									taskGroup={taskGroup}
								/>
							);
						})}
					</AnimatePresence>

					{hasNextPage && (
						<li className="flex items-center justify-center">
							<Button
								type="button"
								size={"sm"}
								variant="ghost"
								disabled={isLoading}
								onClick={() => fetchNextPage()}
							>
								{isLoading ? <Loader /> : <ListPlusIcon />}
								Load more
							</Button>
						</li>
					)}
				</div>
			</DndContext>
			<TaskListBulkActions />
		</>
	);
};

export const TaskGroupItem = ({
	taskGroup,
}: {
	taskGroup: { column: GenericGroup; tasks: Task[] };
}) => {
	const [open, setOpen] = useState(true);
	const { filters } = useTasksViewContext();
	const { setParams: setTaskParams } = useTaskParams();

	const { setNodeRef: setDroppableNodeRef } = useDroppable({
		id: taskGroup.column.name,
	});

	return (
		<div
			key={taskGroup.column.id}
			className="flex flex-col gap-2"
			ref={setDroppableNodeRef}
		>
			<Collapsible open={open} onOpenChange={setOpen} className="group">
				<TaskGroupItemContextMenu taskGroup={taskGroup}>
					<CollapsibleTrigger asChild>
						<h2 className="mb-2 flex cursor-pointer items-center gap-2 rounded-sm bg-accent/30 px-4 py-2 text-sm opacity-70 transition-colors hover:opacity-100">
							<div className="text-muted-foreground group-hover:text-foreground">
								<ChevronRightIcon className="size-4 group-[&[data-state=open]]:hidden" />
								<ChevronDownIcon className="hidden size-4 group-[&[data-state=open]]:inline" />
							</div>
							{taskGroup.column.icon}
							{taskGroup.column.name}
							<span className="rounded-sm border px-1 text-muted-foreground text-xs">
								{taskGroup.tasks.length}
							</span>
						</h2>
					</CollapsibleTrigger>
				</TaskGroupItemContextMenu>

				<CollapsibleContent
					className={cn({
						"overflow-visible!": open,
					})}
				>
					{taskGroup.tasks.map((task) => (
						<TaskContextMenu key={task.id} task={task}>
							<div>
								<TaskItem task={task} />
							</div>
						</TaskContextMenu>
					))}
					<Button
						className="w-full justify-start text-start text-muted-foreground text-xs"
						variant={"ghost"}
						onClick={() => {
							setTaskParams({
								createTask: true,
								taskStatusId: taskGroup.column.id,
								taskProjectId:
									filters.projectId?.length > 0
										? filters.projectId[0]
										: undefined,
							});
						}}
					>
						<PlusIcon className="size-3.5" />
						Create Task
					</Button>
				</CollapsibleContent>
			</Collapsible>
		</div>
	);
};

export const TaskGroupItemContextMenu = ({
	children,
	className,
	taskGroup,
}: {
	children: React.ReactNode;
	className?: string;
	taskGroup: { column: GenericGroup; tasks: Task[] };
}) => {
	const { setTaskSelection } = useTasksViewContext();

	const handleSelectAll = () => {
		const allTaskIds = taskGroup.tasks.map((task) => task.id);
		setTaskSelection(allTaskIds);
	};

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild className={className}>
				{children}
			</ContextMenuTrigger>
			<ContextMenuContent>
				<ContextMenuItem onSelect={handleSelectAll}>
					<CheckSquareIcon />
					Select {taskGroup.tasks.length} tasks
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
};
