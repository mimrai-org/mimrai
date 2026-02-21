import type { RouterOutputs } from "@mimir/trpc";
import { useTaskPanel } from "@/components/panels/task-panel";
import { useUser } from "@/components/user-provider";
import type { EnrichedTask } from "@/hooks/use-data";
import { cn } from "@/lib/utils";
import {
	PropertyAssignee,
	PropertyChecklist,
	PropertyDependencies,
	PropertyDueDate,
	PropertyLabels,
	PropertyMilestone,
	PropertyPriority,
	PropertyProject,
	PropertyStatus,
} from "../properties/task-properties-components";

export const KanbanTask = ({
	task,
	ref,
	className,
	...props
}: {
	className?: string;
	task: EnrichedTask;
	ref?: React.Ref<HTMLDivElement>;
}) => {
	const user = useUser();
	const taskPanel = useTaskPanel();

	return (
		<div
			className={cn(
				"group/task relative flex cursor-pointer flex-col rounded-md border bg-popover transition-colors hover:bg-accent/30",
				{
					"opacity-50!": task.status?.type === "done",
				},
				"slide-in-from-bottom-5 fade-in animate-in ease-in",
				className,
			)}
			ref={ref}
			onClick={(e) => {
				taskPanel.open(task.id);
			}}
			{...props}
		>
			<div className="p-2">
				<div className="flex h-full grow-1 flex-col justify-between gap-2">
					<div className="flex items-center justify-between gap-2">
						<div className={"flex items-center gap-2 text-xs"}>
							<PropertyPriority task={task} />
							{task.sequence !== null && (
								<span className="mr-2 text-muted-foreground tabular-nums">
									{user?.team?.prefix}-{task.sequence}
								</span>
							)}
							<PropertyLabels task={task} />
						</div>
						<PropertyAssignee task={task} />
					</div>
					<div className="flex items-start gap-2">
						<PropertyStatus task={task} />
						<div className="line-clamp-3 break-words font-medium text-sm">
							{task.title}
						</div>
					</div>

					<div className="flex flex-wrap items-center gap-1.5">
						<PropertyDependencies task={task} />

						<PropertyProject task={task} />
						<PropertyMilestone task={task} />
						<PropertyDueDate task={task} />
						<PropertyChecklist task={task} />
					</div>
				</div>
			</div>
			{/* Too much visual noise */}
			{/* <KanbanTaskStamp task={task} /> */}
		</div>
	);
};
