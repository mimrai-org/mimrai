import type { RouterOutputs } from "@mimir/trpc";
import { useTaskPanel } from "@/components/panels/task-panel";
import { TaskProperty } from "@/components/tasks-view/properties/task-properties";
import { useUser } from "@/components/user-provider";
import { cn } from "@/lib/utils";

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
	const taskPanel = useTaskPanel();

	return (
		<div
			className={cn(
				"group/task relative flex min-h-14 cursor-pointer flex-col rounded-md border bg-popover transition-colors hover:bg-accent/30",
				{
					"opacity-50!": task.status?.type === "done",
				},
				"slide-in-from-bottom-5 fade-in animate-in ease-in",
				className,
			)}
			ref={ref}
			onClick={(e) => {
				taskPanel.open(task.id);
				// router.push(`${user?.basePath}/tasks/${task.id}`);
			}}
			{...props}
		>
			{/* <Link href={`${user?.basePath}/tasks/${task.id}`} prefetch={true}> */}
			<div className="p-3">
				<div className="flex h-full grow-1 flex-col justify-between gap-2">
					<div className="flex items-center justify-between gap-2">
						<div className={"flex items-center gap-2 text-xs"}>
							<TaskProperty property="priority" task={task} />
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
		</div>
	);
};
