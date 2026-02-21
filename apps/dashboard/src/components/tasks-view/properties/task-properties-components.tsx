import type { RouterOutputs } from "@mimir/trpc";
import { cn } from "@ui/lib/utils";
import { formatRelative } from "date-fns";
import { CheckSquareIcon } from "lucide-react";
import { memo, useMemo } from "react";
import type { EnrichedTask } from "@/hooks/use-data";
import { DependencyIcon } from "../../dependency-icon";
import { MilestoneIcon } from "../../milestone-icon";
import { ProjectIcon } from "../../project-icon";
import { TaskPropertyAssignee } from "./assignee";
import { TaskPropertyDueDate } from "./due-date";
import { TaskPropertyLabels } from "./labels";
import { Priority } from "./priority";
import { TaskPropertyStatus } from "./status";

export type Task = RouterOutputs["tasks"]["get"]["data"][number];

/**
 * Property component props - each component receives a task with the required fields
 */
type PropertyComponentProps<T> = { task: T };

const PropertyStatusChangedAt = memo(function PropertyStatusChangedAt({
	task,
}: PropertyComponentProps<Pick<Task, "statusChangedAt">>) {
	if (!task.statusChangedAt) return null;
	return (
		<span className="text-muted-foreground text-xs opacity-0 transition-opacity group-hover/task:opacity-100">
			{formatRelative(new Date(task.statusChangedAt), new Date())}
		</span>
	);
});

const PropertyPriority = memo(function PropertyPriority({
	task,
}: PropertyComponentProps<Pick<Task, "priority">>) {
	if (!task.priority) return null;
	return (
		<div className="flex size-5.5 items-center justify-center rounded-sm px-2 text-xs">
			<Priority value={task.priority} />
		</div>
	);
});

const PropertyDependencies = memo(function PropertyDependencies({
	task,
}: PropertyComponentProps<Pick<Task, "dependencies" | "id">>) {
	const group = useMemo(() => {
		if (!task.dependencies) return {};
		const record: Record<string, number> = {};
		for (const dependency of task.dependencies) {
			const type =
				dependency.type === "blocks" && dependency.statusType === "done"
					? "relates_to"
					: dependency.type;
			const direction = dependency.dependsOnTaskId === task.id ? "from" : "to";
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
});

const PropertyStatus = memo(function PropertyStatus({
	task,
}: PropertyComponentProps<Pick<EnrichedTask, "status" | "id">>) {
	return <TaskPropertyStatus status={task.status} id={task.id} />;
});

const PropertyLabels = memo(function PropertyLabels({
	task,
}: PropertyComponentProps<Pick<EnrichedTask, "labels">>) {
	return <TaskPropertyLabels labels={task.labels} />;
});

const PropertyDueDate = memo(function PropertyDueDate({
	task,
}: PropertyComponentProps<Pick<EnrichedTask, "dueDate">>) {
	if (!task.dueDate) return null;
	return <TaskPropertyDueDate task={task} />;
});

const PropertyChecklist = memo(function PropertyChecklist({
	task,
}: PropertyComponentProps<Pick<EnrichedTask, "checklistSummary">>) {
	if (!task.checklistSummary?.total || task.checklistSummary.total <= 0)
		return null;
	return (
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
	);
});

const PropertyProject = memo(function PropertyProject({
	task,
}: PropertyComponentProps<Pick<EnrichedTask, "project">>) {
	if (!task.project) return null;
	return (
		<span className="flex h-5.5 items-center gap-2 rounded-sm bg-secondary px-2 text-xs">
			<ProjectIcon className="size-3.5" {...task.project} />
			{task.project.name}
		</span>
	);
});

const PropertyMilestone = memo(function PropertyMilestone({
	task,
}: PropertyComponentProps<Pick<Task, "milestone">>) {
	if (!task.milestone) return null;
	return (
		<span className="flex h-5.5 items-center gap-2 rounded-sm bg-secondary px-2 text-xs">
			<MilestoneIcon className="size-3.5" {...task.milestone} />
			{task.milestone.name}
		</span>
	);
});

const PropertyAssignee = memo(function PropertyAssignee({
	task,
}: PropertyComponentProps<Task>) {
	return <TaskPropertyAssignee task={task} />;
});

/**
 * Map of property keys to their React components.
 * All components are properly memoized for optimal rendering in virtualized lists.
 */
export const PropertiesComponents = {
	statusChangedAt: PropertyStatusChangedAt,
	priority: PropertyPriority,
	dependencies: PropertyDependencies,
	status: PropertyStatus,
	labels: PropertyLabels,
	dueDate: PropertyDueDate,
	checklist: PropertyChecklist,
	project: PropertyProject,
	milestone: PropertyMilestone,
	assignee: PropertyAssignee,
} as const;

// Re-export individual components for direct usage
export {
	PropertyStatusChangedAt,
	PropertyPriority,
	PropertyDependencies,
	PropertyStatus,
	PropertyLabels,
	PropertyDueDate,
	PropertyChecklist,
	PropertyProject,
	PropertyMilestone,
	PropertyAssignee,
};

/**
 * @deprecated Use PropertiesComponents instead
 */
export const propertiesComponents = PropertiesComponents;
