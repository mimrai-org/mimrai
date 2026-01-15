"use client";

import type { RouterOutputs } from "@mimir/trpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { create } from "zustand";
import {
	type GenericGroup,
	type TasksGroupBy,
	tasksGroupByOptions,
	useTasksGrouped,
} from "@/components/tasks-view/tasks-group";
import { useTasksViewContext } from "@/components/tasks-view/tasks-view";
import { trpc } from "@/utils/trpc";

// Types
export type Task = RouterOutputs["tasks"]["get"]["data"][number];
export type Column = RouterOutputs["statuses"]["get"]["data"][number];
export type TeamMember = RouterOutputs["teams"]["getMembers"][number];
export type Project = RouterOutputs["projects"]["get"]["data"][number];

export type KanbanData = Record<
	string,
	{
		column: GenericGroup;
		tasks: Task[];
	}
>;
export type KanbanStore = {
	overColumnName?: string;
	activeTaskId?: string;
	hiddenColumns: (string | undefined)[];
	setOverColumnName: (name?: string) => void;
	setActiveTaskId: (id?: string) => void;
	toggleColumnHide: (name: string) => void;
};

// Zustand store for kanban drag state
export const useKanbanStore = create<KanbanStore>((set) => ({
	overColumnName: undefined,
	activeTaskId: undefined,
	hiddenColumns: [],
	setOverColumnName: (name) => set({ overColumnName: name }),
	setActiveTaskId: (id) => set({ activeTaskId: id }),
	toggleColumnHide: (name) =>
		set((state) => {
			const isOpen = state.hiddenColumns.includes(name);
			let newOpenColumns: (string | undefined)[];
			if (isOpen) {
				newOpenColumns = state.hiddenColumns.filter((col) => col !== name);
			} else {
				newOpenColumns = [...state.hiddenColumns, name];
				if (newOpenColumns.length > 3) {
					newOpenColumns.shift(); // Keep only last three opened columns
				}
			}
			return { hiddenColumns: newOpenColumns };
		}),
}));

export function useKanbanBoard() {
	const { tasks: boardData, columns, reorderTask } = useTasksGrouped();

	// 4. Logic: Calculate New Order

	// 5. Handlers
	// const reorderColumn = async (activeId: string, overId: string) => {
	// 	const activeCol = columns?.data.find((c) => c.name === activeId);
	// 	const overCol = columns?.data.find((c) => c.name === overId);

	// 	if (!activeCol || !overCol || activeCol.id === overCol.id) return;

	// 	// Swap orders
	// 	const newActiveOrder = overCol.order;
	// 	const newOverOrder = activeCol.order;

	// 	// Optimistic update could go here, but usually column moves are fast enough to await
	// 	await Promise.all([
	// 		updateColumn({ id: activeCol.id, order: newActiveOrder }),
	// 		updateColumn({ id: overCol.id, order: newOverOrder }),
	// 	]);

	// 	queryClient.invalidateQueries(trpc.columns.get.queryOptions());
	// };

	return {
		columns,
		boardData,
		reorderTask,
	};
}
