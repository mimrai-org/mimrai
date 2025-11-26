import type { RouterOutputs } from "@api/trpc/routers";
import { LabelBadge } from "@ui/components/ui/label-badge";
import { cn } from "@ui/lib/utils";
import { format } from "date-fns";
import { CheckSquareIcon } from "lucide-react";
import { ColumnIcon } from "./column-icon";
import { AssigneeAvatar } from "./kanban/asignee-avatar";
import { Priority } from "./kanban/priority";
import { ProjectIcon } from "./project-icon";

type Task = RouterOutputs["tasks"]["get"]["data"][number];
export const propertiesComponents = {
	labels: (task: Task) => (
		<div className="flex gap-2">
			{task.labels?.map((label) => (
				<LabelBadge key={label.id} {...label} />
			))}
		</div>
	),
	assignee: (task: Task) => <AssigneeAvatar {...task.assignee} />,
	priority: (task: Task) => task.priority && <Priority value={task.priority} />,
	dueDate: (task: Task) =>
		task.dueDate && (
			<time className="flex h-5.5 items-center bg-secondary px-2 text-xs tabular-nums">
				{format(new Date(task.dueDate), "PP")}
			</time>
		),
	column: (task: Task) =>
		task.column && (
			<time className="flex h-5.5 items-center bg-secondary px-2 text-xs tabular-nums">
				<ColumnIcon {...task.column} className="size-3.5" />
				<span className="ml-1">{task.column.name}</span>
			</time>
		),
	checklist: (task: Task) =>
		task.checklistSummary?.total > 0 && (
			<div
				className={cn("flex h-5.5 items-center text-muted-foreground text-xs", {
					"bg-primary px-2 text-primary-foreground":
						task.checklistSummary.completed === task.checklistSummary.total,
				})}
			>
				<CheckSquareIcon className="mr-1 inline size-3.5" />
				{task.checklistSummary.completed}/{task.checklistSummary.total}
			</div>
		),
	project: (task: Task) =>
		task.project && (
			<span className="flex h-5.5 items-center gap-2 bg-secondary px-2 text-xs">
				<ProjectIcon className="size-3.5" {...task.project} />
				{task.project.name}
			</span>
		),
};
