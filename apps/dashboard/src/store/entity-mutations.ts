import type { Document, Member, Project, Status, Task } from "@/hooks/use-data";
import { entityStore } from "@/store/entity-store";
import { queryClient, trpc } from "@/utils/trpc";

// ─── Task Mutations ──────────────────────────────────────────

/**
 * Optimistically update a task in the normalized store.
 * Returns a rollback function in case the API call fails.
 */
export function optimisticUpdateTask(
	id: string,
	partial: Partial<Task>,
): () => void {
	const previous = entityStore.getState().tasks[id];
	entityStore.getState().updateTask(id, partial);

	return () => {
		if (previous) {
			entityStore.getState().updateTask(id, previous);
		}
	};
}

/**
 * Add a task optimistically to the store.
 * Returns a rollback function.
 */
export function optimisticAddTask(task: Task): () => void {
	entityStore.getState().upsertTasks([task]);

	return () => {
		entityStore.getState().removeTask(task.id);
	};
}

/**
 * Remove a task optimistically from the store.
 * Returns a rollback function.
 */
export function optimisticRemoveTask(id: string): () => void {
	const previous = entityStore.getState().tasks[id];
	entityStore.getState().removeTask(id);

	return () => {
		if (previous) {
			entityStore.getState().upsertTasks([previous]);
		}
	};
}

// ─── Status Mutations ────────────────────────────────────────

export function optimisticUpdateStatus(
	id: string,
	partial: Partial<Status>,
): () => void {
	const previous = entityStore.getState().statuses[id];
	entityStore.getState().updateStatus(id, partial);

	return () => {
		if (previous) {
			entityStore.getState().updateStatus(id, previous);
		}
	};
}

// ─── Member Mutations ────────────────────────────────────────

export function optimisticUpdateMember(
	id: string,
	partial: Partial<Member>,
): () => void {
	const previous = entityStore.getState().members[id];
	entityStore.getState().updateMember(id, partial);

	return () => {
		if (previous) {
			entityStore.getState().updateMember(id, previous);
		}
	};
}

// ─── Project Mutations ───────────────────────────────────────

export function optimisticUpdateProject(
	id: string,
	partial: Partial<Project>,
): () => void {
	const previous = entityStore.getState().projects[id];
	entityStore.getState().updateProject(id, partial);

	return () => {
		if (previous) {
			entityStore.getState().updateProject(id, previous);
		}
	};
}

// ─── Document Mutations ──────────────────────────────────────

export function optimisticUpdateDocument(
	id: string,
	partial: Partial<Document>,
): () => void {
	const previous = entityStore.getState().documents[id];
	entityStore.getState().updateDocument(id, partial);

	return () => {
		if (previous) {
			entityStore.getState().updateDocument(id, previous);
		}
	};
}

export function optimisticRemoveDocument(id: string): () => void {
	const previous = entityStore.getState().documents[id];
	entityStore.getState().removeDocument(id);

	return () => {
		if (previous) {
			entityStore.getState().upsertDocuments([previous]);
		}
	};
}

// ─── Invalidation Helpers ────────────────────────────────────
// These trigger TanStack Query refetches which will re-sync the store
// via the sync hooks.

export function invalidateTaskQueries() {
	queryClient.invalidateQueries({
		queryKey: trpc.tasks.get.infiniteQueryKey(),
	});
	queryClient.invalidateQueries(trpc.tasks.get.queryOptions());
}

export function invalidateTaskByIdQuery(id: string) {
	queryClient.invalidateQueries(trpc.tasks.getById.queryOptions({ id }));
}

export function invalidateStatusQueries() {
	queryClient.invalidateQueries({
		queryKey: trpc.statuses.get.queryKey(),
	});
}

export function invalidateMemberQueries() {
	queryClient.invalidateQueries({
		queryKey: trpc.teams.getMembers.queryKey(),
	});
}

export function invalidateProjectQueries() {
	queryClient.invalidateQueries({
		queryKey: trpc.projects.get.queryKey(),
	});
	queryClient.invalidateQueries({
		queryKey: trpc.projects.getById.queryKey(),
	});
}

export function invalidateDocumentQueries() {
	queryClient.invalidateQueries({
		queryKey: trpc.documents.get.queryKey(),
	});
	queryClient.invalidateQueries({
		queryKey: trpc.documents.getById.queryKey(),
	});
}

export function invalidateAgentQueries() {
	queryClient.invalidateQueries({
		queryKey: trpc.agents.get.infiniteQueryKey(),
	});
	queryClient.invalidateQueries({
		queryKey: trpc.agents.get.queryKey(),
	});
	queryClient.invalidateQueries({
		queryKey: trpc.agents.getById.queryKey(),
	});
}
