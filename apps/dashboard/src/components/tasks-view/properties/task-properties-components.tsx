import type { RouterOutputs } from "@mimir/trpc";
import { LabelBadge } from "@ui/components/ui/label-badge";
import { cn } from "@ui/lib/utils";
import { formatRelative } from "date-fns";
import { CheckSquareIcon } from "lucide-react";
import { useMemo } from "react";
import { DependencyIcon } from "../../dependency-icon";
import { MilestoneIcon } from "../../milestone-icon";
import { ProjectIcon } from "../../project-icon";
import { TaskPropertyAssignee } from "./assignee";
import { TaskPropertyDueDate } from "./due-date";
import { TaskPropertyLabels } from "./labels";
import { Priority } from "./priority";
import { TaskPropertyStatus } from "./status";

export type Task = RouterOutputs["tasks"]["get"]["data"][number];
export const propertiesComponents = {
	statusChangedAt: (task: Pick<Task, "statusChangedAt">) =>
		task.statusChangedAt ? (
			<span className="text-muted-foreground text-xs opacity-0 transition-opacity group-hover/task:opacity-100">
				{formatRelative(new Date(task.statusChangedAt), new Date())}
			</span>
		) : null,
	priority: (task: Pick<Task, "priority">) =>
		task.priority && (
			<div className="flex size-5.5 items-center justify-center rounded-sm px-2 text-xs">
				<Priority value={task.priority} />
			</div>
		),
	dependencies: (task: Pick<Task, "dependencies" | "id">) => {
		const group = useMemo(() => {
			if (!task.dependencies) return {};
			const record: Record<string, number> = {};
			for (const dependency of task.dependencies) {
				const type =
					dependency.type === "blocks" && dependency.statusType === "done"
						? "relates_to"
						: dependency.type;
				const direction =
					dependency.dependsOnTaskId === task.id ? "from" : "to";
				const key = `${type}:${direction}`;

				record[key] = (record[key] || 0) + 1;
			}
			return record;
		}, [task.dependencies, task.id]);

		if (!task.dependencies || task.dependencies.length === 0) return null;

		return (
			<div className="flex gap-2">
				{Object.entries(group).map(([key, count]) => {
					const [type, direction] = key.split(":") as [
						(typeof task.dependencies)[number]["type"],
						"to" | "from",
					];
					return (
						<span
							key={key}
							className="flex h-5.5 items-center justify-center gap-2 rounded-sm bg-secondary px-1.5 text-xs"
						>
							<DependencyIcon
								type={type}
								direction={direction}
								className="size-3.5"
							/>

							{count > 1 ? count : null}
						</span>
					);
				})}
			</div>
		);
	},
	status: (task: Pick<Task, "status" | "id">) => (
		<TaskPropertyStatus status={task.status} id={task.id} />
	),
	labels: (task: Pick<Task, "labels">) => {
		return <TaskPropertyLabels labels={task.labels} />;
	},
	dueDate: (task: Pick<Task, "dueDate">) =>
		task.dueDate && <TaskPropertyDueDate task={task} />,

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
	assignee: (task: Task) => <TaskPropertyAssignee task={task} />,
};
