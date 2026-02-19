"use client";

import type { RouterOutputs } from "@mimir/trpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { create } from "zustand";
import { useTasksViewContext } from "@/components/tasks-view/tasks-view";
import { trpc } from "@/utils/trpc";

export type Task = RouterOutputs["tasks"]["get"]["data"][number];

type CalendarDndStore = {
	activeTask: Task | null;
	overDate: string | null;
	setActiveTask: (task: Task | null) => void;
	setOverDate: (date: string | null) => void;
};

export const useCalendarDndStore = create<CalendarDndStore>((set) => ({
	activeTask: null,
	overDate: null,
	setActiveTask: (task) => set({ activeTask: task }),
	setOverDate: (date) => set({ overDate: date }),
}));

export function useCalendarDnd() {
	const { tasks, filters } = useTasksViewContext();
	const queryClient = useQueryClient();

	const { mutateAsync: updateTask } = useMutation(
		trpc.tasks.update.mutationOptions(),
	);

	const updateTaskDueDate = async (taskId: string, newDueDate: Date) => {
		const task = tasks.find((t) => t.id === taskId);
		if (!task) return;

		const dueDateString = newDueDate.toISOString();

		// Optimistic update
		updateCache(taskId, dueDateString);

		// Persist to server
		await updateTask({
			id: taskId,
			dueDate: dueDateString,
		});
	};

	const updateCache = (taskId: string, newDueDate: string) => {
		queryClient.setQueryData(
			trpc.tasks.get.infiniteQueryKey({
				...filters,
				view: filters.viewType === "calendar" ? "list" : filters.viewType,
			}),
			(old) => {
				if (!old) return old;
				return {
					...old,
					pages: old.pages.map((page) => ({
						...page,
						data: page.data.map((t) =>
							t.id === taskId ? { ...t, dueDate: newDueDate } : t,
						),
					})),
				};
			},
		);
	};

	return {
		tasks,
		updateTaskDueDate,
	};
}
