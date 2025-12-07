import type { RouterOutputs } from "@api/trpc/routers";
import { LabelBadge } from "@ui/components/ui/label-badge";
import { cn } from "@ui/lib/utils";
import { format } from "date-fns";
import { CheckSquareIcon } from "lucide-react";
import { memo } from "react";
import { ColumnIcon } from "../column-icon";
import { KanbanAssignee } from "../kanban/kanban-task/assignee";
import { Priority } from "../kanban/priority";
import { MilestoneIcon } from "../milestone-icon";
import { ProjectIcon } from "../project-icon";
import { TaskPropertyDueDate } from "./due-date";
import { useTasksViewContext } from "./tasks-view";

export type Task = RouterOutputs["tasks"]["get"]["data"][number];
export const propertiesComponents = {
	priority: (task: Task) => task.priority && <Priority value={task.priority} />,
	column: (task: Task) =>
		task.column && (
			<time className="flex h-5.5 items-center rounded-sm bg-secondary px-2 text-xs tabular-nums">
				<ColumnIcon {...task.column} className="size-3.5" />
				<span className="ml-1">{task.column.name}</span>
			</time>
		),
	labels: (task: Task) => (
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

	checklist: (task: Task) =>
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
	project: (task: Task) =>
		task.project && (
			<span className="flex h-5.5 items-center gap-2 rounded-sm bg-secondary px-2 text-xs">
				<ProjectIcon className="size-3.5" {...task.project} />
				{task.project.name}
			</span>
		),
	milestone: (task: Task) =>
		task.milestone && (
			<span className="flex h-5.5 items-center gap-2 rounded-sm bg-secondary px-2 text-xs">
				<MilestoneIcon className="size-3.5" {...task.milestone} />
				{task.milestone.name}
			</span>
		),
	assignee: (task: Task) => <KanbanAssignee task={task} />,
};

export const propertiesList = Object.keys(propertiesComponents) as Array<
	keyof typeof propertiesComponents
>;

export const TaskProperty = memo(
	({
		property,
		task,
	}: {
		property: keyof typeof propertiesComponents;
		task: Task;
	}) => {
		const { filters } = useTasksViewContext();

		if (!filters.properties?.includes(property)) return null;

		const Component = propertiesComponents[property];
		return <>{Component(task)}</>;
	},
);

export const TaskProperties = ({ task }: { task: Task }) => {
	const { filters } = useTasksViewContext();

	return propertiesList.map((property) => {
		if (!filters.properties?.includes(property)) return null;

		return <TaskProperty key={property} property={property} task={task} />;
	});
};
