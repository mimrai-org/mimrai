import { create } from "zustand";

interface NotificationStore {
	selectedIds: Map<string, boolean>;
	toggleSelection: (id: string, checked: boolean) => void;
	clearSelection: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
	selectedIds: new Map<string, boolean>(),
	toggleSelection: (id: string, checked: boolean) =>
		set((state) => {
			const newSelectedIds = new Map(state.selectedIds);

			if (checked) {
				newSelectedIds.set(id, true);
			} else {
				newSelectedIds.set(id, false);
			}
			return { selectedIds: newSelectedIds };
		}),
	clearSelection: () => {
		set((state) => {
			const newSelectedIds = new Map(state.selectedIds);
			for (const item of newSelectedIds) {
				newSelectedIds.set(item[0], false);
			}
			return { selectedIds: newSelectedIds };
		});
	},
}));
