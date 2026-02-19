"use client";
import type { RouterInputs, RouterOutputs } from "@mimir/trpc";
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";
import { useActivitiesRealtime } from "@/hooks/use-activities-realtime";
import type { EnrichedTask } from "@/hooks/use-data";
import { useEntityTasks } from "@/hooks/use-entity-data";
import { useTasksFilterParams } from "@/hooks/use-tasks-filter-params";
import { useUser } from "../user-provider";
import { TasksCalendar } from "./calendar/calendar";
import { TasksFilters, type TasksFiltersProps } from "./filters/tasks-filters";
import { TasksBoard } from "./kanban/kanban";
import { TasksList } from "./list/tasks-list";
import type { PropertiesComponents } from "./properties/task-properties-components";
import type { TasksGroupBy } from "./tasks-group";

export type TasksViewType = "board" | "list" | "calendar";
export type TasksViewContextFilters = Exclude<
	RouterInputs["tasks"]["get"],
	void | undefined
> & {
	showEmptyColumns?: boolean;
	groupBy: TasksGroupBy;
	viewType: TasksViewType;
	properties?: Array<keyof typeof PropertiesComponents>;
};
export type TasksViewContextValue = {
	filters: TasksViewContextFilters;
	setFilters: (filters: Partial<TasksViewContextFilters>) => void;

	tasks: EnrichedTask[];

	fetchNextPage: () => void;
	hasNextPage?: boolean;
	isLoading?: boolean;
	viewId?: string;
};
export const TasksViewContext = createContext<TasksViewContextValue | null>(
	null,
);

export const TasksViewProvider = ({
	children,
	value,
}: {
	children: React.ReactNode;
	value: TasksViewContextValue;
}) => {
	return (
		<TasksViewContext.Provider value={value}>
			{children}
		</TasksViewContext.Provider>
	);
};

export const useTasksViewContext = () => {
	const context = useContext(TasksViewContext);
	if (!context) {
		throw new Error(
			"useTasksViewContext must be used within a TasksViewProvider",
		);
	}
	return context;
};

const DEFAULT_FILTERS: TasksViewContextFilters = {
	viewType: "list" as TasksViewType,
	properties: [
		"statusChangedAt",
		"assignee",
		"priority",
		"dependencies",
		"status",
		"dueDate",
		"labels",
		"milestone",
	] as Array<keyof typeof PropertiesComponents>,
	groupBy: "status" as TasksGroupBy,
	search: "",
	pageSize: 100,
};

interface TasksViewProps {
	showFilters?: TasksFiltersProps["showFilters"];
	projectId?: string;
	/**
	 * Unique identifier for the view instance
	 */
	id?: string;
	defaultFilters?: Partial<TasksViewContextFilters>;
}

export const TasksView = ({
	showFilters,
	projectId,
	id: viewId,
	defaultFilters,
}: TasksViewProps) => {
	const user = useUser();
	const { params } = useTasksFilterParams();

	const assigneeIdWithMe = useMemo(() => {
		const source =
			params.assigneeId ||
			defaultFilters?.assigneeId ||
			DEFAULT_FILTERS.assigneeId;
		return source?.map((id) => (id === "me" ? user.id : id));
	}, [params.assigneeId, defaultFilters?.assigneeId, user.id]);

	const [filters, setFilters] = useState<TasksViewContextFilters>({
		...DEFAULT_FILTERS,
		...defaultFilters,
		...params,
		properties:
			(params.properties as Array<keyof typeof PropertiesComponents>) ||
			defaultFilters?.properties ||
			DEFAULT_FILTERS.properties,
		assigneeId: assigneeIdWithMe,
		projectId: projectId ? [projectId] : undefined,
	});

	const handleSetFilters = useCallback(
		(newFilters: Partial<TasksViewContextFilters>) => {
			setFilters((prev) => ({ ...prev, ...newFilters }));
		},
		[],
	);

	// Use the entity store for fetching tasks with normalized data
	const { tasks, isLoading, fetchNextPage, hasNextPage } = useEntityTasks(
		{
			...filters,
			// Calendar view uses the same data as list view
			view: filters.viewType === "calendar" ? "list" : filters.viewType,
		},
		{
			refetchOnWindowFocus: false,
		},
	);

	useActivitiesRealtime();

	const contextValue = useMemo<TasksViewContextValue>(
		() => ({
			filters,
			setFilters: handleSetFilters,
			tasks,
			fetchNextPage,
			hasNextPage,
			viewId,
			isLoading,
		}),
		[
			filters,
			handleSetFilters,
			tasks,
			fetchNextPage,
			hasNextPage,
			viewId,
			isLoading,
		],
	);

	return (
		<div className="flex grow-1 flex-col">
			<TasksViewProvider value={contextValue}>
				<TasksFilters showFilters={showFilters} projectId={projectId} />
				{filters.viewType === "board" && <TasksBoard />}
				{filters.viewType === "list" && <TasksList />}
				{filters.viewType === "calendar" && <TasksCalendar />}
			</TasksViewProvider>
		</div>
	);
};
