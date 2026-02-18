import type { RouterInputs, RouterOutputs } from "@mimir/trpc";
import { queryClient, trpc } from "@/utils/trpc";
import type { Document, Member, Project, Status, Task } from "./use-data";

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

export function invalidateMembersCache() {
	queryClient.invalidateQueries({
		queryKey: trpc.teams.getMembers.queryKey(),
	});
}

export function invalidateAgentsCache() {
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

	if (updatedTask.id) {
		queryClient.invalidateQueries(
			trpc.tasks.getById.queryOptions({ id: updatedTask.id }),
		);
	}
}

export function addTaskToCache(newTask: Task) {
	// Add to infinite queries
	queryClient.setQueriesData(
		{
			queryKey: trpc.tasks.get.infiniteQueryKey(),
		},
		(old: any) => {
			if (!old?.pages) return old;
			return {
				...old,
				pages: old.pages.map((page: any, index: number) => {
					// Add to the first page only for simplicity
					if (index === 0) {
						return {
							...page,
							data: [newTask, ...page.data],
						};
					}
					return page;
				}),
			};
		},
	);

	queryClient.setQueryData(
		trpc.tasks.getById.queryKey({ id: newTask.id }),
		newTask,
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

export function invalidateProjectsCache() {
	queryClient.invalidateQueries(trpc.projects.get.infiniteQueryOptions());
	queryClient.invalidateQueries(trpc.projects.get.queryOptions());
}

/**
 * Invalidate all document list queries to force a refetch.
 */
export function invalidateDocumentsCache() {
	queryClient.invalidateQueries({
		queryKey: trpc.documents.get.queryKey(),
	});

	queryClient.invalidateQueries({
		queryKey: trpc.documents.get.infiniteQueryKey(),
	});

	queryClient.invalidateQueries({
		queryKey: trpc.documents.getById.queryKey(),
	});
}

/**
 * Invalidate a single document's getById query.
 */
export function invalidateDocumentByIdCache(documentId: string) {
	queryClient.invalidateQueries(
		trpc.documents.getById.queryOptions({ id: documentId }),
	);
}

export function updateProjectInCache(updatedProject: Partial<Project>) {
	queryClient.setQueryData(trpc.projects.get.queryKey(), (old) => {
		if (!old?.data) return old;
		return {
			...old,
			data: old.data.map((p) =>
				p.id === updatedProject.id ? { ...p, ...updatedProject } : p,
			),
		};
	});

	queryClient.setQueryData(
		trpc.projects.getById.queryKey({ id: updatedProject.id }),
		(old) => ({ ...old, ...updatedProject }),
	);
}

export function updateDocumentInCache(updatedDocument: Partial<Document>) {
	// Helper: recursively remove a document from the tree by id
	function removeDocById(docs: Document[], docId: string): Document[] {
		return docs
			.filter((doc) => doc.id !== docId)
			.map((doc) => ({
				...doc,
				children: doc.children
					? removeDocById(doc.children, docId)
					: doc.children,
			}));
	}

	// Helper: recursively add a document as a child of the given parentId
	function addDocToParent(
		docs: Document[],
		parentId: string,
		newDoc: Document,
	): Document[] {
		return docs.map((doc) => {
			if (doc.id === parentId) {
				return {
					...doc,
					children: doc.children ? [...doc.children, newDoc] : [newDoc],
				};
			}
			if (doc.children) {
				return {
					...doc,
					children: addDocToParent(doc.children, parentId, newDoc),
				};
			}
			return doc;
		});
	}

	// Helper: recursively update document properties in the tree (no move)
	function updateInTree(docs: Document[]): Document[] {
		return docs.map((doc) => {
			if (doc.id === updatedDocument.id) {
				return { ...doc, ...updatedDocument };
			}
			if (doc.children) {
				return { ...doc, children: updateInTree(doc.children) };
			}
			return doc;
		});
	}

	// Helper: recursively find a document by id
	function findDocInTree(docs: Document[], docId: string): Document | null {
		for (const doc of docs) {
			if (doc.id === docId) return doc;
			if (doc.children) {
				const found = findDocInTree(doc.children, docId);
				if (found) return found;
			}
		}
		return null;
	}

	const parentIdChanged = "parentId" in updatedDocument;

	queryClient.setQueriesData(
		{
			queryKey: trpc.documents.get.queryKey(),
		},
		(old: any) => {
			if (!old?.data) return old;
			let data: Document[] = old.data;

			if (parentIdChanged) {
				const currentDoc = findDocInTree(data, updatedDocument.id!);
				if (currentDoc && currentDoc.parentId !== updatedDocument.parentId) {
					const mergedDoc = { ...currentDoc, ...updatedDocument };

					// Step 1: Remove from current position (works for both root and nested)
					data = removeDocById(data, updatedDocument.id!);

					// Step 2: Insert at new position
					if (updatedDocument.parentId) {
						data = addDocToParent(data, updatedDocument.parentId, mergedDoc);
					} else {
						// Moving to root — add to the root array
						data = [...data, mergedDoc];
					}

					return { ...old, data };
				}
			}

			// Simple property update (no parent change)
			return { ...old, data: updateInTree(data) };
		},
	);

	queryClient.setQueryData(
		trpc.documents.getById.queryKey({ id: updatedDocument.id! }),
		(old) => {
			if (!old) return old;
			return { ...old, ...updatedDocument };
		},
	);
}
