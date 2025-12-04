import type { RouterOutputs } from "@api/trpc/routers";
import { type UseQueryOptions, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { trpc } from "@/utils/trpc";
import { ColumnIcon } from "../column-icon";
import { AssigneeAvatar } from "../kanban/asignee-avatar";
import { MilestoneIcon } from "../milestone-icon";
import { ProjectIcon } from "../project-icon";
import { useTasksViewContext } from "./tasks-view";

export type Task = RouterOutputs["tasks"]["get"]["data"][number];
export type Column = RouterOutputs["columns"]["get"]["data"][number];
export type TeamMember = RouterOutputs["teams"]["getMembers"][number];
export type Project = RouterOutputs["projects"]["get"]["data"][number];
export type Milestone = RouterOutputs["milestones"]["get"]["data"][number];
export type TasksGroupBy = "column" | "assignee" | "project" | "milestone";

export type GenericGroup<O = any> = {
	id: string | null;
	name: string;
	type: TasksGroupBy;
	icon: React.ReactNode;
	data: any;
	original: O;
};
export type GroupByOption<O = any, D = GenericGroup<O>, DD = Array<D>> = {
	label: string;
	updateKey: keyof Task;
	getGroupName: (item: Task) => string;
	getData: (item: Task) => any;
	updateData: (item: Partial<Task>, data: any) => void;
	select: (tasks: Task[], group: O) => Task[];

	queryOptions: UseQueryOptions<DD, any, DD, any>;
};

// Group By Options
export const tasksGroupByOptions: Record<TasksGroupBy, GroupByOption> = {
	column: {
		label: "Column",
		updateKey: "columnId",
		getGroupName: (item) => item.column.name || "No Column",
		getData: (item) => item.column,
		updateData: (item, data) => {
			item.column = data;
		},
		select: (tasks, group) => tasks.filter((t) => t.columnId === group.id),

		queryOptions: trpc.columns.get.queryOptions(
			{
				type: ["to_do", "in_progress", "review", "done"],
			},
			{
				select: (columns) => {
					return columns.data.map((column) => ({
						id: column.id,
						name: column.name,
						type: "column" as const,
						icon: <ColumnIcon {...column} className="size-4!" />,
						data: column,
						original: column,
					}));
				},
			},
		),
	} as GroupByOption<Column>,
	assignee: {
		label: "Assignee",
		updateKey: "assigneeId",
		getGroupName: (item) => item.assignee?.name || "Unassigned",
		getData: (item) => item.assignee,
		updateData: (item, data) => {
			item.assignee = data;
		},
		select: (tasks, group) => tasks.filter((t) => t.assigneeId === group.id),

		queryOptions: trpc.teams.getMembers.queryOptions(
			{},
			{
				select: (members) => {
					return members.map((member) => ({
						id: member.id,
						name: member.name || "No Name",
						type: "assignee" as const,
						icon: <AssigneeAvatar {...member} className="size-4!" />,
						data: member,
						original: member,
					}));
				},
			},
		),
	} as GroupByOption<TeamMember>,
	project: {
		label: "Project",
		updateKey: "projectId",
		getGroupName: (item) => item.project?.name || "No Project",
		getData: (item) => item.project,
		updateData: (item, data) => {
			item.project = data;
		},
		select: (tasks, group) => tasks.filter((t) => t.projectId === group.id),

		queryOptions: trpc.projects.get.queryOptions(
			{},
			{
				select: (projects) => {
					return projects.data.map((project) => ({
						id: project.id,
						name: project.name,
						type: "project" as const,
						icon: <ProjectIcon {...project} className="size-4!" />,
						data: project,
						original: project,
					}));
				},
			},
		),
	} as GroupByOption<Project>,
	milestone: {
		label: "Milestone",
		updateKey: "milestoneId",
		getGroupName: (item) => item.milestone?.name || "No Milestone",
		getData: (item) => item.milestone,
		updateData: (item, data) => {
			item.milestone = data;
		},
		select: (tasks, column) => tasks.filter((t) => t.milestoneId === column.id),

		queryOptions: trpc.milestones.get.queryOptions(
			{},
			{
				select: (milestones) => {
					return milestones.data.map((milestone) => ({
						id: milestone.id,
						name: milestone.name,
						type: "milestone" as const,
						icon: <MilestoneIcon {...milestone} className="size-4!" />,
						data: milestone,
						original: milestone,
					}));
				},
			},
		),
	} as GroupByOption<Milestone>,
};
export const tasksGroupByItems = Object.entries(tasksGroupByOptions).map(
	([value, option]) => ({
		value,
		label: option.label,
	}),
);

export type TasksGroup = Record<
	string,
	{
		column: GenericGroup;
		tasks: Task[];
	}
>;

const priorityOrder: Record<string, number> = {
	urgent: 1,
	high: 2,
	medium: 3,
	low: 4,
};

export const useTasksSorted = () => {
	const { tasks, filters } = useTasksViewContext();

	return useMemo(() => {
		if (!tasks) return [];

		return [...tasks].sort((a, b) => {
			// Weight-based sorting: each criterion only breaks ties from the previous one
			const comparisons = [
				// 1. Sort by column order (only when grouping by column)
				filters.groupBy === "column" ? a.column.order - b.column.order : 0,
				// 2. Sort by priority (urgent > high > medium > low)
				(priorityOrder[a.priority ?? ""] ?? 5) -
					(priorityOrder[b.priority ?? ""] ?? 5),
				// 3. Sort by due date (earliest first, no due date goes last)
				(a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY) -
					(b.dueDate
						? new Date(b.dueDate).getTime()
						: Number.POSITIVE_INFINITY),
				// 4. Sort by order (fallback)
				a.order - b.order,
			];

			// Return the first non-zero comparison (cascading sort)
			for (const diff of comparisons) {
				if (diff !== 0) return diff;
			}
			return 0;
		});
	}, [tasks, filters.groupBy]);
};

export const useTasksGrouped = () => {
	const { filters } = useTasksViewContext();
	const tasks = useTasksSorted();

	const { data: columns } = useQuery(
		tasksGroupByOptions[filters.groupBy as TasksGroupBy]?.queryOptions,
	);

	const group = useMemo(() => {
		if (!tasks) return {};
		if (!columns) return {};

		const group: TasksGroup = {};
		for (const column of columns || []) {
			// if the column type doesn't match the current groupBy, early return
			if (column.type !== filters.groupBy) return {};
			const colName = column.name;
			if (!group[colName]) {
				group[colName] = {
					column,
					tasks: [],
				};
			}
		}

		for (const task of tasks) {
			const options = tasksGroupByOptions[filters.groupBy as TasksGroupBy];
			const groupName = options.getGroupName(task);
			if (!group[groupName]) {
				group[groupName] = {
					column: {
						id: null,
						name: groupName,
						type: filters.groupBy as TasksGroupBy,
						icon: null,
						data: null,
						original: null,
					},
					tasks: [],
				};
			}
			group[groupName]?.tasks.push(task);
		}

		// If showEmptyColumns is false, remove empty columns
		if (filters?.showEmptyColumns === false) {
			for (const key of Object.keys(group)) {
				if (group[key]?.tasks.length === 0) {
					delete group[key];
				}
			}
		}

		return group;
	}, [tasks, columns, filters.groupBy, filters?.showEmptyColumns]);

	return {
		tasks: group,
		columns,
	};
};
