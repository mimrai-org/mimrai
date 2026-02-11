"use client";

import type { RouterInputs, RouterOutputs } from "@mimir/trpc";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useMemo, useRef, useEffect } from "react";
import { queryClient, trpc } from "@/utils/trpc";

type Task = RouterOutputs["tasks"]["get"]["data"][number];
type Status = RouterOutputs["statuses"]["get"]["data"][number];
type Member = RouterOutputs["teams"]["getMembers"][number];

/**
 * Unified hook for fetching tasks with statuses and team members.
 * This hook fetches tasks, statuses, and members separately and performs 
 * client-side joins, providing a single source of truth for task management.
 * 
 * Benefits:
 * - Fetch statuses and members once, reuse across all tasks
 * - Easier cache updates (update one place, reflects everywhere)
 * - Better performance for large task lists
 * - Simpler queryClient.setQueryData patterns
 */
export function useTasksWithData(
	filters?: RouterInputs["tasks"]["get"],
	options?: {
		enabled?: boolean;
		refetchOnWindowFocus?: boolean;
		refetchOnMount?: boolean;
	},
) {
	// Fetch tasks using infinite query
	const {
		data: tasksData,
		isLoading: isLoadingTasks,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		refetch: refetchTasks,
	} = useInfiniteQuery(
		trpc.tasks.get.infiniteQueryOptions(
			{
				pageSize: 100,
				...filters,
			},
			{
				getNextPageParam: (lastPage) => lastPage.meta.cursor,
				enabled: options?.enabled,
				refetchOnWindowFocus: options?.refetchOnWindowFocus,
				refetchOnMount: options?.refetchOnMount,
			},
		),
	);

	// Fetch statuses separately - these rarely change
	const { data: statusesData, isLoading: isLoadingStatuses } = useQuery(
		trpc.statuses.get.queryOptions(
			{},
			{
				enabled: options?.enabled,
				refetchOnWindowFocus: false,
				refetchOnMount: false,
				staleTime: 5 * 60 * 1000, // 5 minutes
			},
		),
	);

	// Fetch team members separately - these change infrequently
	const { data: membersData, isLoading: isLoadingMembers } = useQuery(
		trpc.teams.getMembers.queryOptions(
			{
				includeSystemUsers: true,
			},
			{
				enabled: options?.enabled,
				refetchOnWindowFocus: false,
				refetchOnMount: false,
				staleTime: 5 * 60 * 1000, // 5 minutes
			},
		),
	);

	// Create lookup maps for efficient client-side joins
	const statusesMap = useMemo(() => {
		if (!statusesData?.data) return new Map<string, Status>();
		return new Map(statusesData.data.map((status) => [status.id, status]));
	}, [statusesData]);

	const membersMap = useMemo(() => {
		if (!membersData) return new Map<string, Member>();
		return new Map(membersData.map((member) => [member.id, member]));
	}, [membersData]);

	// Merge data on the client side - this replaces the server-side joins
	const tasks = useMemo(() => {
		if (!tasksData?.pages) return [];

		const allTasks = tasksData.pages.flatMap((page) => page.data);

		// Enrich each task with fresh status and member data from our lookups
		return allTasks.map((task) => {
			const enrichedTask = { ...task };

			// Override status with fresh data from our statuses cache
			if (task.statusId && statusesMap.has(task.statusId)) {
				enrichedTask.status = statusesMap.get(task.statusId)!;
			}

			// Override assignee with fresh data from our members cache
			if (task.assigneeId && membersMap.has(task.assigneeId)) {
				const member = membersMap.get(task.assigneeId)!;
				enrichedTask.assignee = {
					id: member.id,
					name: member.name,
					email: member.email,
					image: member.image,
					color: member.color,
				};
			}

			// Override creator with fresh data from our members cache
			if (task.createdBy && membersMap.has(task.createdBy)) {
				const member = membersMap.get(task.createdBy)!;
				enrichedTask.creator = {
					id: member.id,
					name: member.name,
					email: member.email,
					image: member.image,
					color: member.color,
				};
			}

			return enrichedTask;
		});
	}, [tasksData, statusesMap, membersMap]);

	// Cache individual tasks for getById queries
	const cachedTaskIds = useRef<Set<string>>(new Set());
	useEffect(() => {
		for (const task of tasks) {
			if (!cachedTaskIds.current.has(task.id)) {
				queryClient.setQueryData(
					trpc.tasks.getById.queryKey({ id: task.id }),
					task,
				);
				cachedTaskIds.current.add(task.id);
			}
		}
	}, [tasks]);

	const isLoading = isLoadingTasks || isLoadingStatuses || isLoadingMembers;

	return {
		tasks,
		isLoading,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		refetch: refetchTasks,
		// Expose raw data for advanced use cases
		rawData: {
			tasks: tasksData,
			statuses: statusesData,
			members: membersData,
		},
		// Expose lookup maps for efficient updates
		lookups: {
			statuses: statusesMap,
			members: membersMap,
		},
	};
}

/**
 * Hook for fetching just statuses.
 * Use this when you only need status data without tasks.
 */
export function useStatuses(options?: {
	enabled?: boolean;
	refetchOnWindowFocus?: boolean;
	refetchOnMount?: boolean;
}) {
	return useQuery(
		trpc.statuses.get.queryOptions(
			{},
			{
				enabled: options?.enabled,
				refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
				refetchOnMount: options?.refetchOnMount ?? false,
				staleTime: 5 * 60 * 1000, // 5 minutes
			},
		),
	);
}

/**
 * Hook for fetching just team members.
 * Use this when you only need member data without tasks.
 */
export function useTeamMembers(options?: {
	enabled?: boolean;
	refetchOnWindowFocus?: boolean;
	refetchOnMount?: boolean;
	includeSystemUsers?: boolean;
	isMentionable?: boolean;
}) {
	return useQuery(
		trpc.teams.getMembers.queryOptions(
			{
				includeSystemUsers: options?.includeSystemUsers ?? true,
				isMentionable: options?.isMentionable,
			},
			{
				enabled: options?.enabled,
				refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
				refetchOnMount: options?.refetchOnMount ?? false,
				staleTime: 5 * 60 * 1000, // 5 minutes
			},
		),
	);
}
