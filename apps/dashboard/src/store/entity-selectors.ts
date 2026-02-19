"use client";

import { useMemo } from "react";
import type {
	Document,
	EnrichedTask,
	Member,
	Project,
	Status,
	Task,
} from "@/hooks/use-data";
import { useEntityStore } from "@/store/entity-store";

// ─── Task Selectors ──────────────────────────────────────────

export interface TaskFilters {
	projectId?: string[] | null;
	nProjectId?: string[] | null;
	statusId?: string[] | null;
	statusType?: string[] | null;
	assigneeId?: string[] | null;
	milestoneId?: string[] | null;
	labels?: string[] | null;
	search?: string | null;
	completedBy?: string[] | null;
	recurring?: boolean | null;
}

/**
 * Derives enriched, filtered tasks from the normalized entity store.
 * Because the store is flat, changing a task's `projectId` automatically
 * makes it appear/disappear in the correct filtered views.
 */
export function useStoreTasks(filters?: TaskFilters): EnrichedTask[] {
	const tasks = useEntityStore((s) => s.tasks);
	const statuses = useEntityStore((s) => s.statuses);
	const members = useEntityStore((s) => s.members);
	const projects = useEntityStore((s) => s.projects);

	return useMemo(() => {
		const allTasks = Object.values(tasks);

		const filtered = allTasks.filter((task) => {
			if (!matchesFilter(filters)) return true;

			if (
				filters?.projectId?.length &&
				!filters.projectId.includes(task.projectId ?? "")
			) {
				return false;
			}

			if (
				filters?.nProjectId?.length &&
				filters.nProjectId.includes(task.projectId ?? "")
			) {
				return false;
			}

			if (
				filters?.statusId?.length &&
				!filters.statusId.includes(task.statusId)
			) {
				return false;
			}

			if (filters?.statusType?.length) {
				const status = statuses[task.statusId];
				if (status && !filters.statusType.includes(status.type)) {
					return false;
				}
			}

			if (
				filters?.assigneeId?.length &&
				!filters.assigneeId.includes(task.assigneeId ?? "")
			) {
				return false;
			}

			if (
				filters?.milestoneId?.length &&
				!filters.milestoneId.includes(task.milestoneId ?? "")
			) {
				return false;
			}

			if (filters?.labels?.length) {
				const taskLabels = task.labels?.map((l) => l.id) ?? [];
				if (!filters.labels.some((id) => taskLabels.includes(id))) {
					return false;
				}
			}

			if (filters?.search) {
				const q = filters.search.toLowerCase();
				if (!task.title.toLowerCase().includes(q)) {
					return false;
				}
			}

			if (
				filters?.completedBy?.length &&
				!filters.completedBy.includes(task.completedBy ?? "")
			) {
				return false;
			}

			if (filters?.recurring != null) {
				if (filters.recurring && !task.recurring) return false;
				if (!filters.recurring && task.recurring) return false;
			}

			return true;
		});

		// Sort by order (ascending)
		filtered.sort((a, b) => a.order - b.order);

		// Enrich with related entities
		return filtered.map((task) =>
			enrichTask(task, statuses, members, projects),
		);
	}, [tasks, statuses, members, projects, filters]);
}

/**
 * Get a single enriched task from the store.
 */
export function useStoreTask(id: string | undefined): EnrichedTask | undefined {
	const task = useEntityStore((s) => (id ? s.tasks[id] : undefined));
	const statuses = useEntityStore((s) => s.statuses);
	const members = useEntityStore((s) => s.members);
	const projects = useEntityStore((s) => s.projects);

	return useMemo(() => {
		if (!task) return undefined;
		return enrichTask(task, statuses, members, projects);
	}, [task, statuses, members, projects]);
}

// ─── Status Selectors ────────────────────────────────────────

export function useStoreStatuses(): Status[] {
	const statuses = useEntityStore((s) => s.statuses);
	return useMemo(() => Object.values(statuses), [statuses]);
}

// ─── Member Selectors ────────────────────────────────────────

export function useStoreMembers(options?: {
	includeSystemUsers?: boolean;
}): Member[] {
	const members = useEntityStore((s) => s.members);
	return useMemo(() => {
		const all = Object.values(members);
		if (options?.includeSystemUsers) return all;
		return all.filter((m) => !m.isAgent);
	}, [members, options?.includeSystemUsers]);
}

// ─── Project Selectors ───────────────────────────────────────

export function useStoreProjects(): Project[] {
	const projects = useEntityStore((s) => s.projects);
	return useMemo(() => Object.values(projects), [projects]);
}

// ─── Document Selectors ──────────────────────────────────────

/**
 * Returns documents as a flat list from the store.
 */
export function useStoreDocuments(): Document[] {
	const documents = useEntityStore((s) => s.documents);
	return useMemo(() => Object.values(documents), [documents]);
}

// ─── Helpers ─────────────────────────────────────────────────

function matchesFilter(filters?: TaskFilters): boolean {
	if (!filters) return false;
	return Object.values(filters).some(
		(v) => v != null && (!Array.isArray(v) || v.length > 0),
	);
}

function enrichTask(
	task: Task,
	statuses: Record<string, Status>,
	members: Record<string, Member>,
	projects: Record<string, Project>,
): EnrichedTask {
	const enriched: EnrichedTask = { ...task } as EnrichedTask;

	if (task.statusId && statuses[task.statusId]) {
		enriched.status = statuses[task.statusId];
	}

	if (task.assigneeId && members[task.assigneeId]) {
		enriched.assignee = members[task.assigneeId];
	}

	if (task.createdBy && members[task.createdBy]) {
		enriched.creator = members[task.createdBy];
	}

	if (task.projectId && projects[task.projectId]) {
		enriched.project = projects[task.projectId];
	}

	return enriched;
}
