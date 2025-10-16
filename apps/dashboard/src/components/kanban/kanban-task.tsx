import type { RouterOutputs } from "@mimir/api/trpc";
import { format } from "date-fns";
import { GitPullRequestIcon } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useTaskParams } from "@/hooks/use-task-params";
import { cn } from "@/lib/utils";
import { queryClient, trpc } from "@/utils/trpc";
import { LabelBadge } from "../ui/label-badge";
import { AssigneeAvatar } from "./asignee";
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
	const { setParams } = useTaskParams();

	return (
		<motion.div
			className={cn(
				"flex min-h-26 cursor-pointer flex-col rounded-xs border bg-card p-3",
				{
					"opacity-50!": task.column?.type === "done",
				},
				className,
			)}
			ref={ref}
			animate={{ opacity: 1, y: 0, backgroundColor: "var(--card)" }}
			initial={{ opacity: 0, y: 20 }}
			whileHover={{ backgroundColor: "var(--muted)" }}
			exit={{ opacity: 0, y: 20 }}
			transition={{ duration: 0.2 }}
			layout
			layoutId={`task-${task.id}`}
			onClick={(e) => {
				queryClient.setQueryData(
					trpc.tasks.getById.queryKey({ id: task.id }),
					task,
				);
				setParams({ taskId: task.id });
			}}
			{...props}
		>
			<div className="flex h-full grow-1 flex-col justify-between gap-2">
				<div className="flex items-center justify-between gap-2">
					<span className={"font-medium text-sm"}>
						{task.sequence && (
							<span className="mr-2 text-muted-foreground">
								{task.sequence}
							</span>
						)}
						{task.title}
					</span>
					<AssigneeAvatar {...task.assignee} />
				</div>
				{task.labels?.length > 0 && (
					<div className="mb-2 flex flex-wrap gap-1">
						{task.labels?.slice(0, 3).map((label) => (
							<LabelBadge key={label.id} {...label} />
						))}
					</div>
				)}
				<div className="flex items-center justify-between text-muted-foreground text-xs">
					<div className="flex items-center gap-2">
						{task.dueDate && (
							<time className="text-[10px] tabular-nums">
								{format(new Date(task.dueDate), "PP")}
							</time>
						)}
					</div>
					{task.priority ? <Priority value={task.priority} /> : <div />}
				</div>
				<div className="flex items-center">
					{task.pullRequestPlan?.prUrl && (
						<Link
							href={task.pullRequestPlan.prUrl}
							target="_blank"
							className="flex items-center text-primary text-sm hover:text-primary/80"
							onClick={(e) => e.stopPropagation()}
						>
							<GitPullRequestIcon className="mr-1 inline size-3" />
							{task.pullRequestPlan.prTitle}
						</Link>
					)}
				</div>
			</div>
		</motion.div>
	);
};
