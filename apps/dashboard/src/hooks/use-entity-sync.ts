"use client";

import type { RouterInputs } from "@mimir/trpc";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useEntityStore } from "@/store/entity-store";
import { trpc } from "@/utils/trpc";

/**
 * Syncs TanStack Query data into the normalized entity store.
 *
 * Mount once at the team layout level. This hook:
 * 1. Fetches statuses, members, and projects as simple queries
 * 2. Populates the Zustand entity store whenever query data changes
 *
 * Tasks are synced separately via `useTaskSync` in each view that
 * uses infinite queries, since each view may have different filters.
 */
export function useEntitySync() {
	const { reset } = useEntityStore.getState();
	const resetRef = useRef(reset);

	// Reset store on unmount (team switch)
	useEffect(() => {
		const resetFn = resetRef.current;
		return () => resetFn();
	}, []);

	// Fetch and sync statuses
	const { data: statusesData } = useQuery(
		trpc.statuses.get.queryOptions(
			{},
			{
				refetchOnWindowFocus: false,
				refetchOnMount: false,
				staleTime: 5 * 60 * 1000,
			},
		),
	);

	useEffect(() => {
		if (statusesData?.data) {
			useEntityStore.getState().upsertStatuses(statusesData.data);
		}
	}, [statusesData]);

	// Fetch and sync members
	const { data: membersData } = useQuery(
		trpc.teams.getMembers.queryOptions(
			{ includeSystemUsers: true },
			{
				refetchOnWindowFocus: false,
				refetchOnMount: false,
				staleTime: 5 * 60 * 1000,
			},
		),
	);

	useEffect(() => {
		if (membersData) {
			useEntityStore.getState().upsertMembers(membersData);
		}
	}, [membersData]);

	// Fetch and sync projects
	const { data: projectsData } = useQuery(
		trpc.projects.get.queryOptions(
			{},
			{
				staleTime: 5 * 60 * 1000,
			},
		),
	);

	useEffect(() => {
		if (projectsData?.data) {
			useEntityStore.getState().upsertProjects(projectsData.data);
		}
	}, [projectsData]);
}

/**
 * Syncs an infinite task query's pages into the normalized entity store.
 *
 * Call this in each component/view that fetches tasks with specific filters.
 * The store accumulates all tasks from all active queries — it's additive.
 * Filtering happens at the selector level (useStoreTasks).
 */
export function useTaskSync(
	filters?: RouterInputs["tasks"]["get"],
	options?: {
		enabled?: boolean;
		refetchOnWindowFocus?: boolean;
		refetchOnMount?: boolean;
	},
) {
	const queryResult = useInfiniteQuery(
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

	// Sync pages into entity store
	useEffect(() => {
		if (queryResult.data?.pages) {
			const allTasks = queryResult.data.pages.flatMap((page) => page.data);
			useEntityStore.getState().upsertTasks(allTasks);
		}
	}, [queryResult.data]);

	return queryResult;
}
