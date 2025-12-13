"use client";
import type { RouterInputs, RouterOutputs } from "@api/trpc/routers";
import { useInfiniteQuery } from "@tanstack/react-query";
import { createContext, useContext, useMemo, useState } from "react";
import { useTasksFilterParams } from "@/hooks/use-tasks-filter-params";
import { trpc } from "@/utils/trpc";
import { TasksFilters, type TasksFiltersProps } from "./filters/tasks-filters";
import { TasksBoard } from "./kanban/kanban";
import { TasksList } from "./list/tasks-list";
import type { propertiesComponents } from "./properties/task-properties-components";
import type { TasksGroupBy } from "./tasks-group";

export type TasksViewType = "board" | "list";
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

const defaultFilters: TasksViewContextFilters = {
	viewType: "board" as TasksViewType,
	properties: [
		"assignee",
		"priority",
		"dependencies",
		"status",
		"dueDate",
		"labels",
		"milestone",
		"project",
	] as Array<keyof typeof propertiesComponents>,
	groupBy: "status" as TasksGroupBy,
	pageSize: 100,
};

export const TasksView = ({
	showFilters,
	...props
}: Partial<
	TasksViewContextFilters & Pick<TasksFiltersProps, "showFilters">
>) => {
	const { params } = useTasksFilterParams();

	const [filters, setFilters] = useState<TasksViewContextFilters>({
		...defaultFilters,
		...props,
		...params,
	});

	const { data, fetchNextPage, hasNextPage, isLoading } = useInfiniteQuery(
		trpc.tasks.get.infiniteQueryOptions(
			{
				...filters,
				view: filters.viewType,
			},
			{
				placeholderData: (prev) => prev,
				getNextPageParam: (lastPage) => lastPage.meta.cursor,
			},
		),
	);

	const tasks = useMemo(
		() => data?.pages.flatMap((page) => page.data) || [],
		[data],
	);

	return (
		<TasksViewProvider
			value={{
				filters,
				setFilters: (newFilters) =>
					setFilters((prev) => ({ ...prev, ...newFilters })),
				tasks,
				fetchNextPage,
				hasNextPage,
				isLoading,
			}}
		>
			<TasksFilters showFilters={showFilters} />
			{filters.viewType === "board" && <TasksBoard />}
			{filters.viewType === "list" && <TasksList />}
		</TasksViewProvider>
	);
};
