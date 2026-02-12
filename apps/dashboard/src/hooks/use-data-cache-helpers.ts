import type { RouterInputs, RouterOutputs } from "@mimir/trpc";
import { queryClient, trpc } from "@/utils/trpc";

/**
 * Helper functions for updating tasks cache efficiently.
 * When using useTasksWithData, prefer updating statuses/members cache
 * instead of individual tasks for better consistency.
 */

type Task = RouterOutputs["tasks"]["get"]["data"][number];
type Status = RouterOutputs["statuses"]["get"]["data"][number];
type Member = RouterOutputs["teams"]["getMembers"][number];

/**
 * Update a single status in the cache.
 * This will automatically update all tasks using this status.
 */
export function updateStatusInCache(updatedStatus: Status) {
	queryClient.setQueryData(trpc.statuses.get.queryKey(), (old) => {
		if (!old) return old;
		return {
			...old,
			data: old.data.map((s) =>
				s.id === updatedStatus.id ? updatedStatus : s,
			),
		};
	});
}

/**
 * Update a single member in the cache.
 * This will automatically update all tasks assigned to this member.
 */
export function updateMemberInCache(updatedMember: Member) {
	queryClient.setQueryData(trpc.teams.getMembers.queryKey(), (old) => {
		if (!old) return old;
		return old.map((m) => (m.id === updatedMember.id ? updatedMember : m));
	});
}

/**
 * Update a single task in all task queries.
 * Use this when you update task-specific properties (not status/assignee).
 */
export function updateTaskInCache(updatedTask: Partial<Task>) {
	// Update in infinite queries
	queryClient.setQueriesData(
		{
			queryKey: trpc.tasks.get.infiniteQueryKey(),
		},
		(old: any) => {
			if (!old?.pages) return old;
			return {
				...old,
				pages: old.pages.map((page: any) => ({
					...page,
					data: page.data.map((task: any) =>
						task.id === updatedTask.id ? { ...task, ...updatedTask } : task,
					),
				})),
			};
		},
	);

	// Update in getById query
	queryClient.setQueryData(
		trpc.tasks.getById.queryKey({ id: updatedTask.id }),
		updatedTask,
	);
}

/**
 * Remove a task from all task queries.
 */
export function removeTaskFromCache(taskId: string) {
	// Remove from infinite queries
	queryClient.setQueriesData(
		{ queryKey: trpc.tasks.get.infiniteQueryKey() },
		(old: any) => {
			if (!old?.pages) return old;
			return {
				...old,
				pages: old.pages.map((page: any) => ({
					...page,
					data: page.data.filter((task: any) => task.id !== taskId),
				})),
			};
		},
	);

	// Invalidate getById query
	queryClient.invalidateQueries(
		trpc.tasks.getById.queryOptions({ id: taskId }),
	);
}

/**
 * Invalidate all task queries to force a refetch.
 * Use this sparingly - prefer optimistic updates with the above functions.
 */
export function invalidateTasksCache() {
	queryClient.invalidateQueries(trpc.tasks.get.queryOptions());
	queryClient.invalidateQueries(trpc.tasks.get.infiniteQueryOptions());
}
