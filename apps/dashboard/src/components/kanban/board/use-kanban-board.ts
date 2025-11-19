"use client";

import type { RouterOutputs } from "@mimir/api/trpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { create } from "zustand";
import { trpc } from "@/utils/trpc";

// Types
export type Task = RouterOutputs["tasks"]["get"]["data"][number];
export type Column = RouterOutputs["columns"]["get"]["data"][number];
export type KanbanData = Record<string, Task[]>;
export type KanbanStore = {
	overColumnName?: string;
	activeTaskId?: string;
	setOverColumnName: (name?: string) => void;
	setActiveTaskId: (id?: string) => void;
};

// Zustand store for kanban drag state
export const useKanbanStore = create<KanbanStore>((set) => ({
	overColumnName: undefined,
	activeTaskId: undefined,
	setOverColumnName: (name) => set({ overColumnName: name }),
	setActiveTaskId: (id) => set({ activeTaskId: id }),
}));

const MIN_ORDER = 0;
const MAX_ORDER = 74000;
const DEFAULT_EMPTY_COLUMN_ORDER = 64000;

export function useKanbanBoard(filters: any) {
	const queryClient = useQueryClient();

	// 1. Queries
	const queryKey = {
		assigneeId: filters.assigneeId ?? undefined,
		search: filters.search ?? undefined,
		labels: filters.labels ?? undefined,
		projectId: filters.taskProjectId ?? undefined,
		pageSize: 100,
		view: "board" as const,
	};

	const { data: columns } = useQuery(
		trpc.columns.get.queryOptions({
			type: ["in_progress", "review", "done", "to_do"],
		}),
	);

	const { data: tasks } = useQuery(
		trpc.tasks.get.queryOptions(queryKey, { placeholderData: (prev) => prev }),
	);

	// 2. Mutations
	const { mutateAsync: updateTask } = useMutation(
		trpc.tasks.update.mutationOptions(),
	);
	const { mutateAsync: updateColumn } = useMutation(
		trpc.columns.update.mutationOptions(),
	);

	// 3. Derived State (Grouping)
	const boardData = React.useMemo<KanbanData>(() => {
		if (!tasks?.data || !columns?.data) return {};

		const sortedColumns = [...columns.data].sort((a, b) => a.order - b.order);
		const sortedTasks = [...tasks.data].sort((a, b) => {
			// First by priority (urgent > high > medium > low)
			const priorityOrder = {
				urgent: 1,
				high: 2,
				medium: 3,
				low: 4,
				undefined: 5,
			};
			const priorityDiff =
				(priorityOrder[a.priority as keyof typeof priorityOrder] || 5) -
				(priorityOrder[b.priority as keyof typeof priorityOrder] || 5);
			if (priorityDiff !== 0) return priorityDiff;

			// Then by due date (earliest first)
			const aDue = a.dueDate
				? new Date(a.dueDate).getTime()
				: Number.POSITIVE_INFINITY;
			const bDue = b.dueDate
				? new Date(b.dueDate).getTime()
				: Number.POSITIVE_INFINITY;
			if (aDue !== bDue) return aDue - bDue;

			// Finally by order
			return a.order - b.order;
		});

		return sortedColumns.reduce((acc, column) => {
			acc[column.name] = sortedTasks.filter(
				(task) => task.columnId === column.id,
			);
			return acc;
		}, {} as KanbanData);
	}, [tasks?.data, columns?.data]);

	// 4. Logic: Calculate New Order
	const calculateNewOrder = (
		targetColumnTasks: Task[],
		overItemOrder: number,
		isMovingDown: boolean,
	) => {
		if (isMovingDown) {
			const nextOrder = Math.min(
				MAX_ORDER,
				...targetColumnTasks
					.filter((t) => t.order > overItemOrder)
					.map((t) => t.order),
			);
			return (nextOrder + overItemOrder) / 2;
		}

		const prevOrder = Math.max(
			MIN_ORDER,
			...targetColumnTasks
				.filter((t) => t.order < overItemOrder)
				.map((t) => t.order),
		);
		return (prevOrder + overItemOrder) / 2;
	};

	// 5. Handlers
	const reorderColumn = async (activeId: string, overId: string) => {
		const activeCol = columns?.data.find((c) => c.name === activeId);
		const overCol = columns?.data.find((c) => c.name === overId);

		if (!activeCol || !overCol || activeCol.id === overCol.id) return;

		// Swap orders
		const newActiveOrder = overCol.order;
		const newOverOrder = activeCol.order;

		// Optimistic update could go here, but usually column moves are fast enough to await
		await Promise.all([
			updateColumn({ id: activeCol.id, order: newActiveOrder }),
			updateColumn({ id: overCol.id, order: newOverOrder }),
		]);

		queryClient.invalidateQueries(trpc.columns.get.queryOptions());
	};

	const reorderTask = async (
		activeId: string,
		overId: string | undefined,
		overColumnName: string | undefined,
	) => {
		if (!tasks?.data || !columns?.data) return;

		const activeTask = tasks.data.find((t) => t.id === activeId);
		const targetColumn = columns.data.find((c) => c.name === overColumnName);

		// Case A: Moving to an empty column (overId is undefined or null, but we have column name)
		if (activeTask && targetColumn) {
			if (!targetColumn) return;

			const newTask = {
				...activeTask,
				columnId: targetColumn.id,
				order: DEFAULT_EMPTY_COLUMN_ORDER,
			};
			updateCache(newTask);
			await updateTask({
				id: newTask.id,
				columnId: newTask.columnId,
				order: newTask.order,
			});
			return;
		}

		// Case B: Moving relative to another task
		const overTask = tasks.data.find((t) => t.id === overId);
		if (!activeTask || !overTask) return;

		const targetColumnTasks = tasks.data.filter(
			(t) => t.columnId === overTask.columnId,
		);
		const newOrder = calculateNewOrder(
			targetColumnTasks,
			overTask.order,
			activeTask.order < overTask.order,
		);

		const newTask = {
			...activeTask,
			columnId: overTask.columnId,
			order: newOrder,
		};

		updateCache(newTask);
		await updateTask({
			id: newTask.id,
			columnId: newTask.columnId,
			order: newTask.order,
		});
	};

	const updateCache = (updatedTask: Task) => {
		queryClient.setQueryData(trpc.tasks.get.queryKey(queryKey), (old) => {
			if (!old) return old;
			return {
				...old,
				data: old.data
					.map((t) => (t.id === updatedTask.id ? updatedTask : t))
					.sort((a, b) => a.order - b.order),
			};
		});
	};

	return {
		columns: columns?.data,
		boardData,
		reorderColumn,
		reorderTask,
	};
}
