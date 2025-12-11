import type { RouterOutputs } from "@api/trpc/routers";
import { LabelBadge } from "@ui/components/ui/label-badge";
import { cn } from "@ui/lib/utils";
import { CheckSquareIcon } from "lucide-react";
import { KanbanAssignee } from "../kanban/kanban-task/assignee";
import { Priority } from "../kanban/priority";
import { MilestoneIcon } from "../milestone-icon";
import { ProjectIcon } from "../project-icon";
import { StatusIcon } from "../status-icon";
import { TaskPropertyDueDate } from "./due-date";

export type Task = RouterOutputs["tasks"]["get"]["data"][number];
export const propertiesComponents = {
	priority: (task: Pick<Task, "priority">) =>
		task.priority && <Priority value={task.priority} />,
	status: (task: Pick<Task, "status">) =>
		task.status && (
			<time className="flex h-5.5 items-center rounded-sm bg-secondary px-2 text-xs tabular-nums">
				<StatusIcon {...task.status} className="size-3.5" />
				<span className="ml-1">{task.status.name}</span>
			</time>
		),
	labels: (task: Pick<Task, "labels">) => (
		<div className="flex gap-2">
			{task.labels?.map((label) => (
				<LabelBadge
					key={label.id}
					variant="secondary"
					{...label}
					className="bg-secondary"
				/>
			))}
		</div>
	),
	dueDate: (task: Task) => task.dueDate && <TaskPropertyDueDate task={task} />,

	checklist: (task: Pick<Task, "checklistSummary">) =>
		task.checklistSummary?.total > 0 && (
			<div
				className={cn(
					"flex h-5.5 items-center rounded-sm text-muted-foreground text-xs",
					{
						"bg-primary px-2 text-primary-foreground":
							task.checklistSummary.completed === task.checklistSummary.total,
					},
				)}
			>
				<CheckSquareIcon className="mr-1 inline size-3.5" />
				{task.checklistSummary.completed}/{task.checklistSummary.total}
			</div>
		),
	project: (task: Pick<Task, "project">) =>
		task.project && (
			<span className="flex h-5.5 items-center gap-2 rounded-sm bg-secondary px-2 text-xs">
				<ProjectIcon className="size-3.5" {...task.project} />
				{task.project.name}
			</span>
		),
	milestone: (task: Pick<Task, "milestone">) =>
		task.milestone && (
			<span className="flex h-5.5 items-center gap-2 rounded-sm bg-secondary px-2 text-xs">
				<MilestoneIcon className="size-3.5" {...task.milestone} />
				{task.milestone.name}
			</span>
		),
	assignee: (task: Task) => <KanbanAssignee task={task} />,
};
