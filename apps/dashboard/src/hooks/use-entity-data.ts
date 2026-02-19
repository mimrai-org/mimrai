"use client";

import type { RouterInputs } from "@mimir/trpc";
import { useQuery } from "@tanstack/react-query";
import type { EnrichedTask, Member, Project, Status } from "@/hooks/use-data";
import { useTaskSync } from "@/hooks/use-entity-sync";
import {
	type TaskFilters,
	useStoreMembers,
	useStoreProjects,
	useStoreStatuses,
	useStoreTask,
	useStoreTasks,
} from "@/store/entity-selectors";
import { trpc } from "@/utils/trpc";

// ─── Tasks ───────────────────────────────────────────────────

/**
 * Unified hook for tasks — replaces `useTasks` from use-data.ts.
 *
 * - Uses infinite query for fetching / pagination (via useTaskSync)
 * - Returns filtered + enriched tasks from the normalized store
 * - Automatically handles cross-query consistency: changing a task's
 *   `projectId` or `statusId` moves it between filtered views instantly
 */
export function useEntityTasks(
	filters?: RouterInputs["tasks"]["get"],
	options?: {
		enabled?: boolean;
		refetchOnWindowFocus?: boolean;
		refetchOnMount?: boolean;
	},
) {
	// Fetch tasks + sync into entity store
	const {
		isLoading: isLoadingTasks,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		refetch,
	} = useTaskSync(filters, options);

	// Build selector filters from the query filters
	const selectorFilters: TaskFilters | undefined = filters
		? {
				projectId: filters.projectId ?? undefined,
				nProjectId: filters.nProjectId ?? undefined,
				statusId: filters.statusId ?? undefined,
				statusType: filters.statusType ?? undefined,
				assigneeId: filters.assigneeId ?? undefined,
				milestoneId: filters.milestoneId ?? undefined,
				labels: filters.labels ?? undefined,
				search: filters.search ?? undefined,
				completedBy: filters.completedBy ?? undefined,
				recurring: filters.recurring ?? undefined,
			}
		: undefined;

	// Read enriched, filtered tasks from the normalized store
	const tasks = useStoreTasks(selectorFilters);

	// Loading states  for related data
	const statusesQuery = useQuery(
		trpc.statuses.get.queryOptions(
			{},
			{
				refetchOnWindowFocus: false,
				refetchOnMount: false,
				staleTime: 5 * 60 * 1000,
			},
		),
	);
	const membersQuery = useQuery(
		trpc.teams.getMembers.queryOptions(
			{ includeSystemUsers: true },
			{
				refetchOnWindowFocus: false,
				refetchOnMount: false,
				staleTime: 5 * 60 * 1000,
			},
		),
	);

	const isLoading =
		isLoadingTasks || statusesQuery.isLoading || membersQuery.isLoading;

	return {
		tasks,
		isLoading,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		refetch,
	};
}

/**
 * Get a single enriched task by ID from the normalized store.
 * Also triggers a getById query to ensure the task is loaded if not in store.
 */
export function useEntityTask(id: string | undefined): {
	task: EnrichedTask | undefined;
	isLoading: boolean;
} {
	const { isLoading } = useQuery(
		trpc.tasks.getById.queryOptions(
			{ id: id! },
			{
				enabled: !!id,
				staleTime: 5 * 60 * 1000,
			},
		),
	);

	// Sync single-task query result into the store
	const store = useStoreTask(id);

	return {
		task: store,
		isLoading: isLoading && !store,
	};
}

// ─── Statuses ────────────────────────────────────────────────

/**
 * Returns statuses from the normalized store.
 * The entity sync hook keeps this populated.
 */
export function useEntityStatuses(): {
	data: { data: Status[] } | undefined;
	isLoading: boolean;
} {
	const statuses = useStoreStatuses();
	const { isLoading } = useQuery(
		trpc.statuses.get.queryOptions(
			{},
			{
				refetchOnWindowFocus: false,
				refetchOnMount: false,
				staleTime: 5 * 60 * 1000,
			},
		),
	);

	return {
		data: statuses.length > 0 ? { data: statuses } : undefined,
		isLoading,
	};
}

// ─── Members ─────────────────────────────────────────────────

/**
 * Returns team members from the normalized store.
 */
export function useEntityMembers(
	filters?: RouterInputs["teams"]["getMembers"],
	options?: {
		enabled?: boolean;
		refetchOnWindowFocus?: boolean;
		refetchOnMount?: boolean;
	},
): {
	data: Member[] | undefined;
	isLoading: boolean;
} {
	const members = useStoreMembers({
		includeSystemUsers:
			filters && "includeSystemUsers" in filters
				? filters.includeSystemUsers
				: undefined,
	});
	const { isLoading } = useQuery(
		trpc.teams.getMembers.queryOptions(
			{ ...filters },
			{
				enabled: options?.enabled,
				refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
				refetchOnMount: options?.refetchOnMount ?? false,
				staleTime: 5 * 60 * 1000,
			},
		),
	);

	return {
		data: members.length > 0 ? members : undefined,
		isLoading,
	};
}

// ─── Projects ────────────────────────────────────────────────

/**
 * Returns projects from the normalized store.
 */
export function useEntityProjects(
	filters?: RouterInputs["projects"]["get"],
	options?: {
		enabled?: boolean;
		refetchOnWindowFocus?: boolean;
		refetchOnMount?: boolean;
	},
): {
	data: { data: Project[] } | undefined;
	isLoading: boolean;
} {
	const projects = useStoreProjects();
	const { isLoading } = useQuery(
		trpc.projects.get.queryOptions(
			{ ...filters },
			{
				...options,
				staleTime: 5 * 60 * 1000,
			},
		),
	);

	return {
		data: projects.length > 0 ? { data: projects } : undefined,
		isLoading,
	};
}
