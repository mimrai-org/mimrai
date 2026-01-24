"use client";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import type { RouterOutputs } from "@mimir/trpc";
import { Checkbox } from "@ui/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@ui/components/ui/radio-group";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/user-provider";
import { cn } from "@/lib/utils";
import { TaskProperty } from "../properties/task-properties";
import { useTasksViewContext } from "../tasks-view";

export const TaskItem = ({
	task,
	className,
}: {
	task: RouterOutputs["tasks"]["get"]["data"][number];
	className?: string;
	onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
	dialog?: boolean;
	disableEvent?: boolean;
}) => {
	const { selectedTaskIds, toggleTaskSelection } = useTasksViewContext();
	const isSelected = selectedTaskIds.includes(task.id);

	const { listeners, attributes, setNodeRef, transform, isDragging } =
		useDraggable({
			id: task.id,
		});
	const { setNodeRef: setDroppableNodeRef } = useDroppable({
		id: task.id,
	});

	const router = useRouter();
	const user = useUser();

	return (
		<div
			className={cn(
				"group flex items-center gap-2 rounded-sm px-4 py-2 transition-colors hover:bg-accent dark:hover:bg-accent/30",
				{
					"z-50 opacity-50": isDragging,
				},
			)}
			ref={(node) => {
				setNodeRef(node);
				setDroppableNodeRef(node);
			}}
			{...listeners}
			{...attributes}
			style={{
				transform: transform
					? `translate3d(${transform.x}px, ${transform.y}px, 0)`
					: undefined,
			}}
		>
			<Checkbox
				checked={isSelected}
				onCheckedChange={() => {
					toggleTaskSelection(task.id);
				}}
				onClick={(e) => e.stopPropagation()}
			/>
			{/* <RadioGroup
				value={isSelected ? "true" : "false"}
				onValueChange={(v) => {
					toggleTaskSelection(task.id);
				}}
			>
				<RadioGroupItem value="true" />
			</RadioGroup> */}
			<button
				type="button"
				className={cn(
					"flex w-full flex-col justify-between gap-2 bg-transparent sm:flex-row",
					className,
				)}
				onClick={(e) => {
					if (isDragging) return;
					e.preventDefault();
					router.push(
						`${user?.basePath}/projects/${task.projectId}/${task.id}`,
					);
				}}
			>
				<div className="flex items-center gap-2 text-start text-sm">
					<TaskProperty property="priority" task={task} />
					{task.sequence !== null && (
						<span className="text-muted-foreground text-xs tabular-nums">
							{user?.team?.prefix}-{task.sequence}
						</span>
					)}
					<TaskProperty property="status" task={task} />
					<h3 className="font-medium">{task.title}</h3>
				</div>
				<div className="hidden flex-wrap items-center justify-end gap-2 md:flex">
					<TaskProperty property="dependencies" task={task} />
					<TaskProperty property="dueDate" task={task} />
					<TaskProperty property="project" task={task} />
					<TaskProperty property="milestone" task={task} />
					<TaskProperty property="assignee" task={task} />
				</div>
			</button>
		</div>
	);
};
