"use client";

import type { RouterOutputs } from "@mimir/trpc";
import { useMutation } from "@tanstack/react-query";
import { create } from "zustand";
import { useTasksViewContext } from "@/components/tasks-view/tasks-view";
import { optimisticUpdateTask } from "@/store/entity-mutations";
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
	const { tasks } = useTasksViewContext();

	const { mutateAsync: updateTask } = useMutation(
		trpc.tasks.update.mutationOptions(),
	);

	const updateTaskDueDate = async (taskId: string, newDueDate: Date) => {
		const task = tasks.find((t) => t.id === taskId);
		if (!task) return;

		const dueDateString = newDueDate.toISOString();

		// Optimistic update via entity store
		optimisticUpdateTask(taskId, { dueDate: dueDateString });

		// Persist to server
		await updateTask({
			id: taskId,
			dueDate: dueDateString,
		});
	};

	return {
		tasks,
		updateTaskDueDate,
	};
}
