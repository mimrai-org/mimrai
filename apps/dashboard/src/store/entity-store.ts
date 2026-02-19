import { create } from "zustand";
import type { Document, Member, Project, Status, Task } from "@/hooks/use-data";

// ─── Entity Maps ─────────────────────────────────────────────

export interface EntityState {
	tasks: Record<string, Task>;
	statuses: Record<string, Status>;
	members: Record<string, Member>;
	projects: Record<string, Project>;
	documents: Record<string, Document>;
}

export interface EntityActions {
	// Batch upsert — merges incoming entities without clobbering unloaded fields
	upsertTasks: (tasks: Task[]) => void;
	upsertStatuses: (statuses: Status[]) => void;
	upsertMembers: (members: Member[]) => void;
	upsertProjects: (projects: Project[]) => void;
	upsertDocuments: (documents: Document[]) => void;

	// Single entity updates (partial merge)
	updateTask: (id: string, partial: Partial<Task>) => void;
	updateStatus: (id: string, partial: Partial<Status>) => void;
	updateMember: (id: string, partial: Partial<Member>) => void;
	updateProject: (id: string, partial: Partial<Project>) => void;
	updateDocument: (id: string, partial: Partial<Document>) => void;

	// Removals
	removeTask: (id: string) => void;
	removeDocument: (id: string) => void;

	// Full reset (team switch)
	reset: () => void;
}

const initialState: EntityState = {
	tasks: {},
	statuses: {},
	members: {},
	projects: {},
	documents: {},
};

// ─── Store ───────────────────────────────────────────────────

export const useEntityStore = create<EntityState & EntityActions>()((set) => ({
	...initialState,

	// ── Batch upserts ──────────────────────────────────────

	upsertTasks: (tasks) =>
		set((state) => {
			const next = { ...state.tasks };
			for (const task of tasks) {
				const existing = next[task.id];
				next[task.id] = existing ? { ...existing, ...task } : task;
			}
			return { tasks: next };
		}),

	upsertStatuses: (statuses) =>
		set(() => {
			const next: Record<string, Status> = {};
			for (const status of statuses) {
				next[status.id] = status;
			}
			return { statuses: next };
		}),

	upsertMembers: (members) =>
		set(() => {
			const next: Record<string, Member> = {};
			for (const member of members) {
				next[member.id] = member;
			}
			return { members: next };
		}),

	upsertProjects: (projects) =>
		set(() => {
			const next: Record<string, Project> = {};
			for (const project of projects) {
				next[project.id] = project;
			}
			return { projects: next };
		}),

	upsertDocuments: (documents) =>
		set(() => {
			const next: Record<string, Document> = {};
			for (const doc of documents) {
				next[doc.id] = doc;
			}
			return { documents: next };
		}),

	// ── Single entity updates ──────────────────────────────

	updateTask: (id, partial) =>
		set((state) => {
			const existing = state.tasks[id];
			if (!existing) return state;
			return {
				tasks: { ...state.tasks, [id]: { ...existing, ...partial } },
			};
		}),

	updateStatus: (id, partial) =>
		set((state) => {
			const existing = state.statuses[id];
			if (!existing) return state;
			return {
				statuses: { ...state.statuses, [id]: { ...existing, ...partial } },
			};
		}),

	updateMember: (id, partial) =>
		set((state) => {
			const existing = state.members[id];
			if (!existing) return state;
			return {
				members: { ...state.members, [id]: { ...existing, ...partial } },
			};
		}),

	updateProject: (id, partial) =>
		set((state) => {
			const existing = state.projects[id];
			if (!existing) return state;
			return {
				projects: { ...state.projects, [id]: { ...existing, ...partial } },
			};
		}),

	updateDocument: (id, partial) =>
		set((state) => {
			const existing = state.documents[id];
			if (!existing) return state;
			return {
				documents: { ...state.documents, [id]: { ...existing, ...partial } },
			};
		}),

	// ── Removals ───────────────────────────────────────────

	removeTask: (id) =>
		set((state) => {
			const { [id]: _, ...rest } = state.tasks;
			return { tasks: rest };
		}),

	removeDocument: (id) =>
		set((state) => {
			const { [id]: _, ...rest } = state.documents;
			return { documents: rest };
		}),

	// ── Reset ──────────────────────────────────────────────

	reset: () => set(initialState),
}));

// ─── Non-hook accessors (for use outside React) ─────────────

export const entityStore = {
	getState: useEntityStore.getState,
	subscribe: useEntityStore.subscribe,
};
