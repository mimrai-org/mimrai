"use client";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

const STORAGE_KEY = "panels-state";
const MAX_PANELS = 5;

export interface PanelInstance<T = Record<string, unknown>> {
	type: string;
	id: string;
	data?: T;
}

interface PanelContextValue {
	panels: PanelInstance[];
	minimized?: boolean;
	setMinimized: (minimized: boolean) => void;
	openPanel: (type: string, id: string, data?: Record<string, unknown>) => void;
	closePanel: (type: string, id: string) => void;
	closePanelsByType: (type: string) => void;
	closeAllPanels: () => void;
	bringToFront: (type: string, id: string) => void;
	isPanelOpen: (type: string, id: string) => boolean;
	getPanel: <T = Record<string, unknown>>(
		type: string,
		id: string,
	) => PanelInstance<T> | undefined;
}

const PanelContext = createContext<PanelContextValue | null>(null);

interface PanelProviderProps {
	children: React.ReactNode;
}

function loadPersistedState(): PanelInstance[] {
	if (typeof window === "undefined") {
		return [];
	}

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			return parsed.panels || [];
		}
	} catch {
		// Ignore parse errors
	}
	return [];
}

function persistState(panels: PanelInstance[]) {
	if (typeof window === "undefined") return;

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify({ panels }));
	} catch {
		// Ignore storage errors
	}
}

export function PanelProvider({ children }: PanelProviderProps) {
	const [panels, setPanels] = useState<PanelInstance[]>([]);
	const [isHydrated, setIsHydrated] = useState(false);
	const [minimized, setMinimized] = useState(false);

	// Hydrate from localStorage on mount
	useEffect(() => {
		const storedPanels = loadPersistedState();
		setPanels(storedPanels);
		setIsHydrated(true);
	}, []);

	// Persist to localStorage when state changes
	useEffect(() => {
		if (isHydrated) {
			persistState(panels);
		}
	}, [panels, isHydrated]);

	const openPanel = useCallback(
		(type: string, id: string, data?: Record<string, unknown>) => {
			setPanels((current) => {
				const existingIndex = current.findIndex(
					(p) => p.type === type && p.id === id,
				);

				if (existingIndex >= 0) {
					console.log("Panel already open, bringing to front:", type, id);
					// Panel already open, move to end (bring to front) and update data
					const panel = current[existingIndex];
					const withoutPanel = current.filter((_, i) => i !== existingIndex);
					const newArray = [
						...withoutPanel,
						{ ...panel, data: data ?? panel.data },
					];
					console.log("New panel order:", newArray);
					return newArray;
				}

				if (current.length >= MAX_PANELS) {
					// Remove the oldest panel (first in array)
					const [, ...rest] = current;
					const newPanel: PanelInstance = {
						type,
						id,
						data,
					};
					return [...rest, newPanel];
				}

				// Add new panel at the end
				const newPanel: PanelInstance = {
					type,
					id,
					data,
				};
				return [...current, newPanel];
			});
		},
		[],
	);

	const closePanel = useCallback((type: string, id: string) => {
		setPanels((current) =>
			current.filter((p) => !(p.type === type && p.id === id)),
		);
	}, []);

	const closePanelsByType = useCallback((type: string) => {
		setPanels((current) => current.filter((p) => p.type !== type));
	}, []);

	const closeAllPanels = useCallback(() => {
		setPanels([]);
	}, []);

	const bringToFront = useCallback((type: string, id: string) => {
		setPanels((current) => {
			const panelIndex = current.findIndex(
				(p) => p.type === type && p.id === id,
			);
			if (panelIndex < 0 || panelIndex === current.length - 1) return current;

			// Move panel to end of array
			const panel = current[panelIndex];
			const withoutPanel = current.filter((_, i) => i !== panelIndex);
			return [...withoutPanel, panel];
		});
	}, []);

	const isPanelOpen = useCallback(
		(type: string, id: string) => {
			return panels.some((p) => p.type === type && p.id === id);
		},
		[panels],
	);

	const getPanel = useCallback(
		<T = Record<string, unknown>>(type: string, id: string) => {
			return panels.find((p) => p.type === type && p.id === id) as
				| PanelInstance<T>
				| undefined;
		},
		[panels],
	);

	const value = useMemo(
		() => ({
			panels,
			minimized,
			setMinimized,
			openPanel,
			closePanel,
			closePanelsByType,
			closeAllPanels,
			bringToFront,
			isPanelOpen,
			getPanel,
		}),
		[
			panels,
			minimized,
			setMinimized,
			openPanel,
			closePanel,
			closePanelsByType,
			closeAllPanels,
			bringToFront,
			isPanelOpen,
			getPanel,
		],
	);

	return (
		<PanelContext.Provider value={value}>{children}</PanelContext.Provider>
	);
}

export function usePanels() {
	const context = useContext(PanelContext);

	if (!context) {
		throw new Error("usePanels must be used within a PanelProvider");
	}

	return context;
}

/**
 * Hook to manage a specific panel type
 */
export function usePanel<
	T extends Record<string, unknown> = Record<string, unknown>,
>(type: string) {
	const {
		openPanel,
		closePanel,
		closePanelsByType,
		bringToFront,
		isPanelOpen,
		getPanel,
		panels,
	} = usePanels();

	const open = useCallback(
		(id: string, data?: T) => {
			openPanel(type, id, data);
		},
		[openPanel, type],
	);

	const close = useCallback(
		(id: string) => {
			closePanel(type, id);
		},
		[closePanel, type],
	);

	const closeAll = useCallback(() => {
		closePanelsByType(type);
	}, [closePanelsByType, type]);

	const focus = useCallback(
		(id: string) => {
			bringToFront(type, id);
		},
		[bringToFront, type],
	);

	const isOpen = useCallback(
		(id: string) => {
			return isPanelOpen(type, id);
		},
		[isPanelOpen, type],
	);

	const get = useCallback(
		(id: string) => {
			return getPanel<T>(type, id);
		},
		[getPanel, type],
	);

	const typePanels = useMemo(
		() => panels.filter((p) => p.type === type) as PanelInstance<T>[],
		[panels, type],
	);

	return {
		open,
		close,
		closeAll,
		focus,
		isOpen,
		get,
		panels: typePanels,
	};
}
