import { create } from "zustand";

type ContextItemTask = {
	type: "task";
	id: string;
};

type ContextItemProject = {
	type: "project";
	id: string;
};

export type ContextItem = { key: string; label: string } & (
	| ContextItemTask
	| ContextItemProject
);

type ChatContext = {
	items: ContextItem[];
	addItem: (item: ContextItem) => void;
	removeItem: (key: string) => void;
	setItems: (items: ContextItem[]) => void;
};

export const useChatContext = create<ChatContext>((set) => ({
	items: [],
	addItem: (item) =>
		set((state) => {
			return {
				items: [...state.items.filter((i) => i.key !== item.key), item],
			};
		}),
	removeItem: (key) => {
		set((state) => {
			return {
				items: state.items.filter((i) => i.key !== key),
			};
		});
	},
	setItems: (items) => set({ items }),
}));
