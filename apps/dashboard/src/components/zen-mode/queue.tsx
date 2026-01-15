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
	DialogHeader,
	DialogTitle,
} from "@ui/components/ui/dialog";
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
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { useUser } from "@/components/user-provider";
import { queryClient, trpc } from "@/utils/trpc";
import { useZenMode, type ZenModeTask } from "./use-zen-mode";

export const ZenModeQueue = () => {
	const [open, setOpen] = useState(false);
	const { tasks, currentTask } = useZenMode();

	if (!tasks || tasks.length === 0) {
		return null;
	}

	const currentTaskIndex = tasks.findIndex(
		(task) => task.id === currentTask?.id,
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

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				showCloseButton={false}
				overlayClassName="dark:bg-background bg-background"
				className="-translate-y-1/2 top-1/2 flex w-full justify-center bg-transparent sm:max-w-[40vw]"
			>
				<DialogHeader className="hidden">
					<DialogTitle />
				</DialogHeader>
				<div className="flex max-h-[70vh] flex-1 flex-col overflow-y-auto">
					<ZenModeQueueList tasks={tasks} />
				</div>
			</DialogContent>
		</Dialog>
	);
};

export const ZenModeQueueList = ({
	tasks,
	itemClassName,
}: {
	tasks: ZenModeTask[];
	itemClassName?: string;
}) => {
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

			queryClient.setQueryData(trpc.zen.queue.queryKey(), (oldData) => {
				if (!oldData) return oldData;
				return {
					...oldData,
					data: newTasks,
				};
			});
		}
	};

	return (
		<DndContext onDragEnd={handleDragEnd}>
			{tasks.map((task, index) => (
				<ZenModeQueueItem
					key={task.id}
					task={task}
					index={index}
					className={itemClassName}
				/>
			))}
		</DndContext>
	);
};

const ZenModeQueueItem = ({
	task,
	index,
	className,
}: {
	task: ZenModeTask;
	index?: number;
	className?: string;
}) => {
	const { currentTask } = useZenMode();
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
		<motion.div
			variants={{
				hidden: { opacity: 0, x: 20, filter: "blur(4px)" },
				show: { opacity: 1, x: 0, filter: "blur(0px)" },
			}}
			className={cn("w-full")}
			style={{
				transform: transform
					? `translate3d(${transform.x}px, ${transform.y}px, 0)`
					: undefined,
			}}
		>
			<div
				className={cn(
					"group flex items-center gap-2 rounded-md px-4 py-2 font-light text-lg transition-all hover:bg-accent/50",
					{
						"hover:bg-accent": isDragging,
						"bg-accent": task.id === currentTask.id,
						"translate-x-4": isOver && !isDragging,
					},
					className,
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
						{/* <span className="flex items-center gap-2 text-muted-foreground">
							{user?.team?.prefix}-{task.sequence}
						</span> */}
						<span className="flex items-center gap-2 text-muted-foreground">
							{index !== undefined ? index + 1 : ""}.
						</span>
						<div className="truncate">{task.title}</div>
					</div>
				</div>
				<div
					className={cn(
						"ml-auto flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100",
						{
							"opacity-100": task.id === currentTask.id,
						},
					)}
				>
					<Tooltip>
						<TooltipTrigger asChild>
							<div className="text-muted-foreground hover:text-foreground">
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
						className="text-muted-foreground hover:text-foreground"
					>
						<ArrowUpRight className="size-5" />
					</Link>
				</div>
			</div>
		</motion.div>
	);
};
