import type { RouterOutputs } from "@mimir/api/trpc";
import { format } from "date-fns";
import {
	CheckSquareIcon,
	GitPullRequestArrowIcon,
	GitPullRequestIcon,
} from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
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
				"flex min-h-26 cursor-pointer flex-col rounded-xs border bg-card",
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
			<div className="p-3">
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

					<div className="flex min-h-4 items-center justify-between text-muted-foreground text-xs">
						<div className="flex items-center gap-2">
							{task.dueDate && (
								<time className="text-[10px] tabular-nums">
									{format(new Date(task.dueDate), "PP")}
								</time>
							)}
						</div>
						<div className="flex items-center gap-4">
							{task.checklistSummary?.total > 0 && (
								<div
									className={cn(
										"flex items-center text-muted-foreground text-xs",
										{
											"rounded-sm bg-primary px-2 py-1 text-primary-foreground":
												task.checklistSummary.completed ===
												task.checklistSummary.total,
										},
									)}
								>
									<CheckSquareIcon className="mr-1 inline size-3.5" />
									{task.checklistSummary.completed}/
									{task.checklistSummary.total}
								</div>
							)}
							{task.priority ? <Priority value={task.priority} /> : <div />}
						</div>
					</div>
					<div className="flex items-center">
						{task.pullRequestPlan?.prUrl && (
							<Link
								href={task.pullRequestPlan.prUrl}
								target="_blank"
								className="flex items-start text-primary text-sm hover:text-primary/80"
								onClick={(e) => e.stopPropagation()}
							>
								{task.pullRequestPlan.status === "pending" && (
									<GitPullRequestArrowIcon
										className={cn("mt-1 mr-1 inline size-3")}
									/>
								)}
								{task.pullRequestPlan.status === "completed" && (
									<GitPullRequestIcon
										className={cn("mt-1 mr-1 inline size-3 text-violet-600")}
									/>
								)}
								{task.pullRequestPlan.prTitle}
							</Link>
						)}
					</div>
				</div>
			</div>
		</motion.div>
	);
};
