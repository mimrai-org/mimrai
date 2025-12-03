"use client";
import type { RouterOutputs } from "@api/trpc/routers";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { createContext, useContext, useMemo } from "react";
import { useTasksFilterParams } from "@/hooks/use-tasks-filter-params";
import { trpc, type trpcClient } from "@/utils/trpc";
import { TasksBoard } from "../kanban/board/board";
import type { propertiesComponents } from "./task-properties";
import { TasksFilters, type TasksFiltersProps } from "./tasks-filters";
import { TasksList } from "./tasks-list";

export type TasksViewType = "board" | "list";
export type TasksViewContextValue = {
	filters: Parameters<typeof trpc.tasks.get.queryKey>[0];
	tasks: RouterOutputs["tasks"]["get"]["data"];
	properties: Array<keyof typeof propertiesComponents>;
	viewType: TasksViewType;
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

export const TasksView = ({
	showFilters,
	...props
}: Partial<
	Omit<ReturnType<typeof useTasksFilterParams>, "setParams" | "hasParams"> &
		Pick<TasksFiltersProps, "showFilters">
>) => {
	const { setParams, ...params } = useTasksFilterParams();

	// Combine URL params with props
	const preFilters = Object.entries(params).reduce(
		(acc, [key, value]) => {
			if (params[key as keyof typeof params] != null) {
				const paramsValue = params[key as keyof typeof params];
				// @ts-expect-error
				acc[key] = paramsValue;
				return acc;
			}

			if (props[key as keyof typeof props]) {
				// @ts-expect-error
				acc[key] = props[key as keyof typeof props];
				return acc;
			}

			return acc;
		},
		{} as typeof params,
	);

	// Determine view type
	const viewType = (preFilters.viewType as TasksViewType) || "board";
	// Determine properties to show
	const properties = useMemo(
		() =>
			(preFilters.properties as Array<keyof typeof propertiesComponents>) || [],
		[preFilters.properties],
	);

	const filters = useMemo<Parameters<typeof trpcClient.tasks.get.query>[0]>(
		() => ({
			assigneeId: preFilters.assigneeId ?? undefined,
			columnId: preFilters.columnId ?? undefined,
			columnType: preFilters.columnType ?? undefined,
			search: preFilters.search ?? undefined,
			labels: preFilters.labels ?? undefined,
			projectId: preFilters.taskProjectId ?? undefined,
			milestoneId: preFilters.taskMilestoneId ?? undefined,
			recurring: preFilters.recurring ?? undefined,
			pageSize: 100,
			view: viewType,
		}),
		[
			preFilters.assigneeId,
			preFilters.search,
			preFilters.columnId,
			preFilters.labels,
			preFilters.taskProjectId,
			preFilters.taskMilestoneId,
			preFilters.columnType,
			preFilters.recurring,
			viewType,
		],
	);

	const { data, fetchNextPage, hasNextPage, isLoading } = useInfiniteQuery(
		trpc.tasks.get.infiniteQueryOptions(filters, {
			placeholderData: (prev) => prev,
			getNextPageParam: (lastPage) => lastPage.meta.cursor,
		}),
	);

	const tasks = useMemo(
		() => data?.pages.flatMap((page) => page.data) || [],
		[data],
	);

	return (
		<TasksViewProvider
			value={{
				filters,
				tasks,
				viewType,
				properties,
				fetchNextPage,
				hasNextPage,
				isLoading,
			}}
		>
			<TasksFilters showFilters={showFilters} />
			{viewType === "board" && <TasksBoard />}
			{viewType === "list" && <TasksList />}
		</TasksViewProvider>
	);
};
