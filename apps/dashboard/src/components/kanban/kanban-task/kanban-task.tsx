import type { RouterOutputs } from "@mimir/api/trpc";
import { LabelBadge } from "@mimir/ui/label-badge";
import { format } from "date-fns";
import { BoxIcon, CheckSquareIcon } from "lucide-react";
import { motion } from "motion/react";
import { ProjectIcon } from "@/components/project-icon";
import { useTaskParams } from "@/hooks/use-task-params";
import { cn } from "@/lib/utils";
import { queryClient, trpc } from "@/utils/trpc";
import { Priority } from "../priority";
import { KanbanAssignee } from "./assignee";

export type KanbanTask = RouterOutputs["tasks"]["get"]["data"][number];

export const KanbanTask = ({
	task,
	ref,
	className,
	...props
}: {
	className?: string;
	task: KanbanTask;
	ref?: React.Ref<HTMLDivElement>;
}) => {
	const { setParams } = useTaskParams();

	return (
		<motion.div
			className={cn(
				"flex min-h-14 cursor-pointer flex-col rounded-none bg-accent transition-colors hover:bg-accent/50",
				{
					"opacity-50!": task.column?.type === "done",
				},
				className,
			)}
			ref={ref}
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
						<span className={"flex items-start gap-1 text-sm"}>
							{task.sequence !== null && (
								<span className="mr-2 text-muted-foreground tabular-nums">
									{task.sequence}
								</span>
							)}
							<span className="break-words font-medium">{task.title}</span>
						</span>
						<KanbanAssignee task={task} />
					</div>

					<div className="mt-2 flex flex-wrap items-center gap-2">
						{task.priority && <Priority value={task.priority} />}
						{task.project && (
							<div className="flex h-5.5 items-center gap-1 border px-2 font-medium text-xs">
								<ProjectIcon className="size-3.5" {...task.project} />
								{task.project.name}
							</div>
						)}
						{task.labels?.length > 0 && (
							<div className="flex flex-wrap gap-1">
								{task.labels?.slice(0, 3).map((label) => (
									<LabelBadge key={label.id} {...label} variant="outline" />
								))}
							</div>
						)}
						{task.dueDate && (
							<time className="flex h-5.5 items-center border px-2 font-medium text-xs tabular-nums">
								{format(new Date(task.dueDate), "PP")}
							</time>
						)}
						{task.checklistSummary?.total > 0 && (
							<div
								className={cn(
									"flex h-5.5 items-center border px-2 font-medium text-muted-foreground text-xs",
									{
										"bg-primary px-2 text-primary-foreground":
											task.checklistSummary.completed ===
											task.checklistSummary.total,
									},
								)}
							>
								<CheckSquareIcon className="mr-1 inline size-3.5" />
								{task.checklistSummary.completed}/{task.checklistSummary.total}
							</div>
						)}
					</div>
				</div>
			</div>
		</motion.div>
	);
};
