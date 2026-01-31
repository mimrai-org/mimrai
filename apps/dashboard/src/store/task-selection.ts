import { create } from "zustand";

interface TaskSelectionState {
	selectedTaskIds: string[];
	toggleTaskSelection: (taskId: string) => void;
	setTaskSelection: (taskIds: string[]) => void;
	clearTaskSelection: () => void;
}

export const useTaskSelectionStore = create<TaskSelectionState>()((set) => ({
	selectedTaskIds: [],

	toggleTaskSelection: (taskId: string) =>
		set((state) => ({
			selectedTaskIds: state.selectedTaskIds.includes(taskId)
				? state.selectedTaskIds.filter((id) => id !== taskId)
				: [...state.selectedTaskIds, taskId],
		})),

	setTaskSelection: (taskIds: string[]) => set({ selectedTaskIds: taskIds }),

	clearTaskSelection: () => set({ selectedTaskIds: [] }),
}));

/**
 * Selector hook for checking if a specific task is selected.
 * This prevents rerenders when other tasks' selection state changes.
 */
export const useIsTaskSelected = (taskId: string): boolean =>
	useTaskSelectionStore((state) => state.selectedTaskIds.includes(taskId));

/**
 * Selector hook for getting stable action references.
 * Actions don't change so this won't cause rerenders.
 */
export const useTaskSelectionActions = () =>
	useTaskSelectionStore((state) => ({
		toggleTaskSelection: state.toggleTaskSelection,
		setTaskSelection: state.setTaskSelection,
		clearTaskSelection: state.clearTaskSelection,
	}));
