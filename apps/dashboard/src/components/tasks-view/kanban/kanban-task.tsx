import type { RouterOutputs } from "@mimir/trpc";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { TaskProperty } from "@/components/tasks-view/properties/task-properties";
import { useUser } from "@/components/user-provider";
import { useTaskParams } from "@/hooks/use-task-params";
import { cn } from "@/lib/utils";
import { queryClient, trpc } from "@/utils/trpc";

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
	const user = useUser();
	const { setParams } = useTaskParams();

	return (
		<motion.div
			className={cn(
				"relative flex min-h-14 cursor-pointer flex-col rounded-md border bg-card transition-colors hover:bg-accent dark:hover:bg-accent/30",
				{
					"opacity-50!": task.status?.type === "done",
				},
				className,
			)}
			ref={ref}
			// transition={{ duration: 0.2 }}
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: 10 }}
			onClick={(e) => {
				queryClient.setQueryData(
					trpc.tasks.getById.queryKey({ id: task.id }),
					task,
				);
				setParams({ taskId: task.id });
				// router.push(`${user?.basePath}/tasks/${task.id}`);
			}}
			{...props}
		>
			{/* <Link href={`${user?.basePath}/tasks/${task.id}`} prefetch={true}> */}
			<div className="p-3">
				<div className="flex h-full grow-1 flex-col justify-between gap-2">
					<div className="flex items-center justify-between gap-2">
						<div className={"flex items-center gap-1 text-xs"}>
							{task.sequence !== null && (
								<span className="mr-2 text-muted-foreground tabular-nums">
									{user?.team?.prefix}-{task.sequence}
								</span>
							)}
							<TaskProperty property="labels" task={task} />
						</div>
						<TaskProperty property="assignee" task={task} />
					</div>
					<div className="flex items-start gap-2">
						<TaskProperty property="status" task={task} />
						<div className="line-clamp-3 break-words font-medium text-sm">
							{task.title}
						</div>
					</div>

					<div className="flex flex-wrap items-center gap-1.5">
						<TaskProperty property="priority" task={task} />
						<TaskProperty property="dependencies" task={task} />

						<TaskProperty property="project" task={task} />
						<TaskProperty property="milestone" task={task} />
						<TaskProperty property="dueDate" task={task} />
						<TaskProperty property="checklist" task={task} />
					</div>
				</div>
			</div>
			{/* </Link> */}
			{/* Too much visual noise */}
			{/* <KanbanTaskStamp task={task} /> */}
		</motion.div>
	);
};
