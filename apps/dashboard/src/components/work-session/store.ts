import { create } from "zustand";

export interface WorkSessionState {
	timer: number;
	setTimer: (time: number) => void;
}

export const useWorkSessionStore = create<WorkSessionState>((set) => ({
	timer: 0,
	setTimer: (time: number) => set({ timer: time }),
}));
