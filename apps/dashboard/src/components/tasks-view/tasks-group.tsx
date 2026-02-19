import type { RouterOutputs } from "@mimir/trpc";
import {
	type UseQueryOptions,
	useMutation,
	useQuery,
} from "@tanstack/react-query";
import { useMemo } from "react";
import type { EnrichedTask, Task } from "@/hooks/use-data";
import { optimisticUpdateTask } from "@/store/entity-mutations";
import { trpc } from "@/utils/trpc";
import { AssigneeAvatar } from "../asignee-avatar";
import { MilestoneIcon } from "../milestone-icon";
import { ProjectIcon } from "../project-icon";
import { StatusIcon } from "../status-icon";
import { Priority } from "./properties/priority";
import { useTasksViewContext } from "./tasks-view";

export type Status = RouterOutputs["statuses"]["get"]["data"][number];
export type TeamMember = RouterOutputs["teams"]["getMembers"][number];
export type Project = RouterOutputs["projects"]["get"]["data"][number];
export type Milestone = RouterOutputs["milestones"]["get"]["data"][number];
export type TasksGroupBy =
	| "none"
	| "status"
	| "assignee"
	| "priority"
	| "project"
	| "milestone";

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
	updateKey: keyof EnrichedTask;
	getGroupName: (item: EnrichedTask) => string;
	getData: (item: EnrichedTask) => any;
	updateData: (item: Partial<EnrichedTask>, data: any) => void;
	select: (tasks: EnrichedTask[], group: O) => EnrichedTask[];

	queryOptions: UseQueryOptions<any, any, DD, any>;
};

// Group By Options
export const tasksGroupByOptions: Record<TasksGroupBy, GroupByOption> = {
	none: {
		label: "None",
		updateKey: "order",
		getGroupName: () => "All Tasks",
		getData: () => null,
		updateData: () => {},
		select: (tasks) => tasks,
		queryOptions: {
			queryKey: ["tasks", "groupBy", "none"],
			queryFn: async () => {
				return [];
			},
		},
	} as GroupByOption<null>,
	status: {
		label: "Status",
		updateKey: "statusId",
		getGroupName: (item) => item.status?.name || "No Status",
		getData: (item) => item.status,
		updateData: (item, data) => {
			item.status = data;
		},
		select: (tasks, group) => tasks.filter((t) => t.statusId === group.id),

		queryOptions: trpc.statuses.get.queryOptions(
			{
				type: ["to_do", "in_progress", "review", "done"],
			},
			{
				select: (statuses) => {
					return statuses.data.map((status: Status) => ({
						id: status.id,
						name: status.name,
						type: "status" as const,
						icon: <StatusIcon {...status} className="size-4!" />,
						data: status,
						original: status,
					}));
				},
			},
		),
	} as GroupByOption<Status>,
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
					return members.map((member: TeamMember) => ({
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
	priority: {
		label: "Priority",
		updateKey: "priority",
		getGroupName: (item) =>
			item.priority
				? item.priority.charAt(0).toUpperCase() + item.priority.slice(1)
				: "No Priority",
		getData: (item) => item.priority,
		updateData: (item, data) => {
			item.priority = data;
		},
		select: (tasks, group) =>
			tasks.filter((t) => t.priority === group.toLowerCase()),

		queryOptions: {
			queryKey: ["tasks", "groupBy", "priority"],
			queryFn: async () => {
				const priorities = ["Urgent", "High", "Medium", "Low"];
				return priorities.map((priority) => ({
					id: priority.toLowerCase(),
					name: priority,
					type: "priority" as const,
					icon: <Priority value={priority.toLowerCase() as any} />,
					data: priority.toLowerCase(),
					original: priority.toLowerCase(),
				}));
			},
		},
	} as GroupByOption<string>,
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
					return projects.data.map((project: Project) => ({
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
					return milestones.data.map((milestone: Milestone) => ({
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
				// Sort by status order (only when grouping by status)
				filters.groupBy === "status"
					? (a.status?.order ?? Number.MAX_SAFE_INTEGER) -
						(b.status?.order ?? Number.MAX_SAFE_INTEGER)
					: 0,
				// Sort by priority (urgent > high > medium > low)
				(priorityOrder[a.priority ?? ""] ?? 5) -
					(priorityOrder[b.priority ?? ""] ?? 5),
				// Sort by due date (earliest first, no due date goes last)
				(a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY) -
					(b.dueDate
						? new Date(b.dueDate).getTime()
						: Number.POSITIVE_INFINITY),
				// Sort by order (fallback)
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

const MIN_ORDER = 0;
const MAX_ORDER = 74000;
const DEFAULT_EMPTY_COLUMN_ORDER = 64000;

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

	// 2. Mutations
	const { mutateAsync: updateTask } = useMutation(
		trpc.tasks.update.mutationOptions(),
	);

	const calculateNewOrder = (
		targetColumnTasks: Task[],
		overItemOrder: number,
		isMovingDown: boolean,
	) => {
		if (isMovingDown) {
			const nextOrder = Math.min(
				MAX_ORDER,
				...targetColumnTasks
					.filter((t) => t.order > overItemOrder)
					.map((t) => t.order),
			);
			return (nextOrder + overItemOrder) / 2;
		}

		const prevOrder = Math.max(
			MIN_ORDER,
			...targetColumnTasks
				.filter((t) => t.order < overItemOrder)
				.map((t) => t.order),
		);
		return (prevOrder + overItemOrder) / 2;
	};

	const reorderTask = async (
		activeId: string,
		overId: string | undefined,
		overColumnName: string | undefined,
	) => {
		if (!tasks) return;

		const activeTask = tasks.find((t) => t.id === activeId);
		const targetColumn = group[overColumnName || ""]?.column;

		// Case A: Moving to an empty column (overId is undefined or null, but we have column name)
		if (activeTask && targetColumn) {
			if (!targetColumn) return;

			const options = tasksGroupByOptions[targetColumn.type];
			const columnUpdateKey = options.updateKey;

			const newTaskPayload = {
				id: activeTask.id,
				[columnUpdateKey]: targetColumn.id,
				order: DEFAULT_EMPTY_COLUMN_ORDER,
				statusChangedAt: new Date().toISOString(),
			};
			options.updateData(newTaskPayload, targetColumn.data);

			updateCache(newTaskPayload);
			await updateTask({
				id: newTaskPayload.id,
				[columnUpdateKey]: newTaskPayload[columnUpdateKey],
				order: newTaskPayload.order,
			});
			return;
		}

		// Case B: Moving relative to another task
		const overTask = tasks.find((t) => t.id === overId);
		if (!activeTask || !overTask) return;

		const options = tasksGroupByOptions[filters.groupBy as TasksGroupBy];
		const columnUpdateKey = options.updateKey;

		const targetColumnTasks = tasks.filter(
			(t) => t[columnUpdateKey] === overTask[columnUpdateKey],
		);
		const newOrder = calculateNewOrder(
			targetColumnTasks,
			overTask.order,
			activeTask.order < overTask.order,
		);

		const newTaskPayload = {
			id: activeTask.id,
			[columnUpdateKey]: overTask[columnUpdateKey],
			order: newOrder,
			statusChangedAt: new Date().toISOString(),
		};
		options.updateData(newTaskPayload, options.getData(overTask));

		updateCache(newTaskPayload);

		await updateTask({
			id: newTaskPayload.id,
			[columnUpdateKey]: newTaskPayload[columnUpdateKey],
			order: newTaskPayload.order,
		});
	};

	const updateCache = (updatedTask: Partial<Task>) => {
		if (updatedTask.id) {
			optimisticUpdateTask(updatedTask.id, updatedTask);
		}
	};

	return {
		tasks: group,
		columns,
		reorderTask,
	};
};
