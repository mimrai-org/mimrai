"use client";
import {
	DndContext,
	type DragEndEvent,
	useDraggable,
	useDroppable,
} from "@dnd-kit/core";
import { useMutation } from "@tanstack/react-query";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@ui/components/ui/dialog";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@ui/components/ui/sheet";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@ui/components/ui/tooltip";
import { cn } from "@ui/lib/utils";
import {
	ArrowUpRight,
	CircleQuestionMarkIcon,
	ExternalLinkIcon,
	GripVertical,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { queryClient, trpc } from "@/utils/trpc";
import { propertiesComponents } from "../tasks-view/properties/task-properties-components";
import { type Task, useZenMode } from "./use-zen-mode";

export const ZenModeQueue = () => {
	const [open, setOpen] = useState(false);
	const { tasks, currentTask } = useZenMode();

	if (!tasks || tasks.length === 0) {
		return null;
	}

	const currentTaskIndex = tasks.findIndex(
		(task) => task.id === currentTask.id,
	);
	const totalTasks = tasks.length;

	return (
		<>
			<button
				type="button"
				className="group fixed top-4 right-4 flex items-center gap-4 text-xs"
				onClick={() => setOpen(true)}
			>
				<div className="flex items-center gap-2">
					<ExternalLinkIcon className="size-3.5 text-muted-foreground transition-colors group-hover:text-foreground" />
					<span className="uppercase">QUEUE</span>
				</div>
				<span className="text-muted-foreground">{totalTasks} left</span>
				<span className="text-muted-foreground">
					{currentTaskIndex} skipped
				</span>
			</button>
			<ZenModeQueueSheet open={open} onOpenChange={setOpen} />
		</>
	);
};

const ZenModeQueueSheet = ({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) => {
	const { tasks, currentTask } = useZenMode();
	const { mutate: updateTask } = useMutation(
		trpc.tasks.update.mutationOptions({
			onSettled: () => {
				queryClient.invalidateQueries(trpc.tasks.get.queryOptions());
			},
		}),
	);

	const handleDragEnd = ({ active, over }: DragEndEvent) => {
		const activeTask = tasks.find((task) => task.id === active.id);
		const overTask = tasks.find((task) => task.id === over?.id);

		if (activeTask && overTask && activeTask.id !== overTask.id) {
			const newTasks = [...tasks];
			const oldIndex = newTasks.findIndex((task) => task.id === activeTask.id);
			const newIndex = newTasks.findIndex((task) => task.id === overTask.id);

			// Remove the active task from its old position
			newTasks.splice(oldIndex, 1);
			// Insert the active task at its new position
			newTasks.splice(newIndex, 0, activeTask);

			activeTask.focusOrder = newIndex + 1;
			overTask.focusOrder = oldIndex + 1;

			// update focusOrder based on new position only for the moved task
			[activeTask, overTask].map((task, index) => {
				return updateTask({
					id: task.id,
					focusOrder: task.focusOrder,
				});
			});

			queryClient.setQueryData(
				trpc.tasks.getZenModeQueue.queryKey(),
				(oldData) => {
					if (!oldData) return oldData;
					return {
						...oldData,
						data: newTasks,
					};
				},
			);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				overlayClassName="dark:bg-background/99 bg-background/99"
				className="-translate-y-1/2 top-1/2 w-auto bg-transparent sm:max-w-3xl"
			>
				<DialogHeader>
					<DialogTitle className="text-4xl">Zen Queue</DialogTitle>
					<DialogDescription>
						Your zone, your rules. Drag and drop to reorder your tasks as you
						see fit.
					</DialogDescription>
				</DialogHeader>
				<div className="flex max-h-[70vh flex-col overflow-y-auto">
					<DndContext onDragEnd={handleDragEnd}>
						{tasks.map((task) => (
							<ZenModeQueueItem key={task.id} task={task} />
						))}
					</DndContext>
				</div>
			</DialogContent>
		</Dialog>
	);
};

const ZenModeQueueItem = ({ task }: { task: Task }) => {
	const user = useUser();
	const { setNodeRef, isOver } = useDroppable({
		id: task.id,
	});

	const {
		setNodeRef: setDraggableNodeRef,
		listeners,
		attributes,
		transform,
		isDragging,
	} = useDraggable({
		id: task.id,
	});

	return (
		<div
			style={{
				transform: transform
					? `translate3d(${transform.x}px, ${transform.y}px, 0)`
					: undefined,
			}}
		>
			<div
				className={cn(
					"group flex items-center gap-2 rounded-md px-2 py-3 text-base transition-all hover:bg-accent/50",
					{
						"hover:bg-accent": isDragging,
						"translate-x-4": isOver && !isDragging,
					},
				)}
				ref={setNodeRef}
				{...listeners}
				{...attributes}
			>
				<div
					ref={setDraggableNodeRef}
					className="cursor-grab overflow-hidden transition-colors hover:text-foreground"
				>
					<div className="flex flex-1 items-center gap-2">
						<span className="flex items-center gap-2 text-muted-foreground text-sm">
							{user?.team?.prefix}-{task.sequence}
						</span>
						<div className="max-w-[400px] truncate">{task.title}</div>
					</div>
				</div>
				<div className="ml-auto flex items-center gap-2">
					<Tooltip>
						<TooltipTrigger asChild>
							<div className="text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100">
								<CircleQuestionMarkIcon className="size-4" />
							</div>
						</TooltipTrigger>
						<TooltipContent>
							<div className="max-w-xs">
								{task.focusReason || "Priority order"}
							</div>
						</TooltipContent>
					</Tooltip>
					<Link
						href={`${user?.basePath}/zen/${task.id}`}
						className="text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
					>
						<ArrowUpRight className="size-5" />
					</Link>
				</div>
			</div>
		</div>
	);
};
