import type { RouterOutputs } from "@mimir/api/trpc";
import { format } from "date-fns";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Assignee } from "./asignee";
import { Priority } from "./priority";

type Task = RouterOutputs["tasks"]["get"]["data"][number];

export const KanbanTask = ({
	task,
	ref,
	className,
	...props
}: {
	className?: string;
	task: Task;
	ref?: React.Ref<HTMLDivElement>;
}) => {
	return (
		<motion.div
			className={cn(
				"flex min-h-24 flex-col rounded-xs border bg-card p-3",
				{
					"opacity-50!": task.column?.isFinalState,
				},
				className,
			)}
			ref={ref}
			animate={{ opacity: 1, y: 0 }}
			initial={{ opacity: 0, y: 20 }}
			whileHover={{ scale: 1.02 }}
			exit={{ opacity: 0, y: -20 }}
			transition={{ duration: 0.2 }}
			layout
			layoutId={`task-${task.id}`}
			{...props}
		>
			<div className="flex h-full grow-1 flex-col justify-between gap-2">
				<div className="flex items-center justify-between gap-2">
					<span className="font-medium text-sm">{task.title}</span>
				</div>
				<div className="flex items-center justify-between text-muted-foreground text-xs">
					<Assignee {...task.assignee} />
					{task.priority ? <Priority value={task.priority} /> : <div />}
					{task.dueDate && (
						<time className="text-[10px] tabular-nums">
							{format(new Date(task.dueDate), "h:mm a, MMM d")}
						</time>
					)}
				</div>
			</div>
		</motion.div>
	);
};
