import {
	DndContext,
	PointerSensor,
	useDraggable,
	useDroppable,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { Button } from "@ui/components/ui/button";
import { ListPlusIcon, PlusIcon } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useTaskParams } from "@/hooks/use-task-params";
import Loader from "../../loader";
import { TaskContextMenu } from "../../task-context-menu";
import { type GenericGroup, type Task, useTasksGrouped } from "../tasks-group";
import { useTasksViewContext } from "../tasks-view";
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
		<AnimatePresence mode="popLayout">
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
					{Object.entries(tasks).map(([_, taskGroup]) => {
						return (
							<TaskGroupItem key={taskGroup.column.id} taskGroup={taskGroup} />
						);
					})}

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
		</AnimatePresence>
	);
};

export const TaskGroupItem = ({
	taskGroup,
}: {
	taskGroup: { column: GenericGroup; tasks: Task[] };
}) => {
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
			<h2 className="flex items-center gap-2 rounded-sm bg-card px-4 py-2 text-sm">
				{taskGroup.column.icon}
				{taskGroup.column.name}
				<span className="text-muted-foreground text-xs">
					{taskGroup.tasks.length}
				</span>
			</h2>
			{taskGroup.tasks.map((task) => (
				<TaskContextMenu key={task.id} task={task}>
					<div>
						<TaskItem task={task} />
					</div>
				</TaskContextMenu>
			))}
			<Button
				className="w-full justify-start border border-transparent border-dashed text-start text-muted-foreground text-xs hover:border-input"
				variant={"ghost"}
				onClick={() => {
					setTaskParams({
						createTask: true,
						taskStatusId: taskGroup.column.id,
						taskProjectId:
							filters.projectId?.length > 0 ? filters.projectId[0] : undefined,
					});
				}}
			>
				<PlusIcon className="size-3.5" />
				Create Task
			</Button>
		</div>
	);
};
