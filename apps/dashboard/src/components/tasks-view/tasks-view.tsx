"use client";
import type { RouterInputs, RouterOutputs } from "@mimir/trpc";
import { useInfiniteQuery } from "@tanstack/react-query";
import { createContext, useContext, useMemo, useState } from "react";
import { useTasksFilterParams } from "@/hooks/use-tasks-filter-params";
import { trpc } from "@/utils/trpc";
import { useUser } from "../user-provider";
import { TasksCalendar } from "./calendar/calendar";
import { TasksFilters, type TasksFiltersProps } from "./filters/tasks-filters";
import { TasksBoard } from "./kanban/kanban";
import { TasksList } from "./list/tasks-list";
import type { propertiesComponents } from "./properties/task-properties-components";
import type { TasksGroupBy } from "./tasks-group";

export type TasksViewType = "board" | "list" | "calendar";
export type TasksViewContextFilters = Exclude<
	RouterInputs["tasks"]["get"],
	void | undefined
> & {
	showEmptyColumns?: boolean;
	groupBy: TasksGroupBy;
	viewType: TasksViewType;
	properties?: Array<keyof typeof propertiesComponents>;
};
export type TasksViewContextValue = {
	filters: TasksViewContextFilters;
	setFilters: (filters: Partial<TasksViewContextFilters>) => void;

	tasks: RouterOutputs["tasks"]["get"]["data"];
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
		"assignee",
		"priority",
		"dependencies",
		"status",
		"dueDate",
		"labels",
		"milestone",
	] as Array<keyof typeof propertiesComponents>,
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
		assigneeId: assigneeIdWithMe,
		projectId: projectId ? [projectId] : undefined,
	});

	const { data, fetchNextPage, hasNextPage, isLoading } = useInfiniteQuery(
		trpc.tasks.get.infiniteQueryOptions(
			{
				...filters,
				// Calendar view uses the same data as list view
				view: filters.viewType === "calendar" ? "list" : filters.viewType,
			},
			{
				getNextPageParam: (lastPage) => lastPage.meta.cursor,
				placeholderData: (oldData) => oldData,
			},
		),
	);

	const tasks = useMemo(
		() => data?.pages.flatMap((page) => page.data) || [],
		[data],
	);

	return (
		<div className="flex grow-1 flex-col">
			<TasksViewProvider
				value={{
					filters,
					setFilters: (newFilters) =>
						setFilters((prev) => ({ ...prev, ...newFilters })),
					tasks,
					fetchNextPage,
					hasNextPage,
					viewId,
					isLoading,
				}}
			>
				<TasksFilters showFilters={showFilters} projectId={projectId} />
				{filters.viewType === "board" && <TasksBoard />}
				{filters.viewType === "list" && <TasksList />}
				{filters.viewType === "calendar" && <TasksCalendar />}
			</TasksViewProvider>
		</div>
	);
};
