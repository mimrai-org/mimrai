"use client";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import type { ZenModeSettings } from "./use-zen-mode";

export const ZEN_MODE_SESSION_STORAGE_KEY = "zen-mode-session";

export const ZenModeSessionContext = createContext<{
	time: number;
	state: "focus" | "break";
	addMinutes: (minutes: number) => void;
	advanceToNextState: (state?: "focus" | "break") => void;
	settings?: ZenModeSettings;
} | null>(null);

export const ZenModeSessionProvider = ({
	children,
	settings,
}: {
	children: React.ReactNode;
	settings?: ZenModeSettings;
}) => {
	const lastTimeRef = useRef(0);
	const offsetTimeRef = useRef(0);
	const firstLoadRef = useRef(true);
	const handleRequestFrameRef = useRef<number | null>(null);
	const [time, setTime] = useState(0);
	const [state, setState] = useState<"focus" | "break">("focus");

	const addMinutes = (minutes: number) => {
		const additionalMs = minutes * 60 * 1000;
		setTime((prev) => prev + additionalMs);
	};

	const advanceToNextState = (nextState?: "focus" | "break") => {
		if (state === nextState) return;

		const focusDurationMs =
			(settings?.settings?.focusGuard.focusDurationMinutes ?? 0) * 60 * 1000;
		const breakDurationMs =
			(settings?.settings?.focusGuard.minBreakDurationMinutes ?? 0) * 60 * 1000;

		setTime((prev) => {
			console.log("Advancing to next state from", prev / 1000 / 60, "minutes");
			if (state === "focus" && (nextState === "break" || !nextState)) {
				return (
					prev +
					(focusDurationMs - (prev % (focusDurationMs + breakDurationMs)))
				);
			}
			return prev + (breakDurationMs - (prev % breakDurationMs));
		});
	};

	const updateState = useCallback(
		(time: number) => {
			setState((prev) => {
				if (!settings?.settings?.focusGuard.enabled) {
					if (prev !== "focus") return "focus";
					return prev;
				}

				const focusDurationMinutes =
					settings?.settings?.focusGuard.focusDurationMinutes ?? 0;
				const minBreakDurationMinutes =
					settings?.settings?.focusGuard.minBreakDurationMinutes ?? 0;

				const focusDurationMs = focusDurationMinutes * 60 * 1000;
				const breakDurationMs = minBreakDurationMinutes * 60 * 1000;

				const cycleDuration = focusDurationMs + breakDurationMs;

				const timeInCycle = time % cycleDuration;

				console.log("Time in cycle:", timeInCycle / 1000 / 60, "minutes");
				console.log("Focus duration (minutes):", focusDurationMs / 1000 / 60);
				console.log("Break duration (minutes):", breakDurationMs / 1000 / 60);

				if (timeInCycle < focusDurationMs) {
					// Focus time
					if (prev !== "focus") return "focus";
					return prev;
				}
				// Break time
				if (prev !== "break") return "break";
				return prev;
			});
		},
		[settings],
	);

	const handleRequestFrame = useCallback((time: number) => {
		const totalTime = time + offsetTimeRef.current;

		const elapsed = totalTime - lastTimeRef.current;

		// Update every 5 seconds
		if (elapsed >= 5000) {
			setTime((prev) => {
				const newTime = prev + elapsed;
				console.log("Updating time to", newTime / 1000 / 60, "minutes");
				sessionStorage.setItem(ZEN_MODE_SESSION_STORAGE_KEY, String(newTime));
				return newTime;
			});
			lastTimeRef.current = totalTime;
		}
		requestAnimationFrame(handleRequestFrame);
	}, []);

	useEffect(() => {
		if (!settings?.settings?.focusGuard.enabled) return;

		if (firstLoadRef.current) {
			const saved = sessionStorage.getItem(ZEN_MODE_SESSION_STORAGE_KEY);
			if (saved) {
				const value = Number(saved);
				console.log("Restoring saved time:", value / 1000 / 60, "minutes");
				offsetTimeRef.current = value - lastTimeRef.current;
				lastTimeRef.current = value;
				setTime(() => value);
			}
			firstLoadRef.current = false;
		}

		handleRequestFrameRef.current = requestAnimationFrame(handleRequestFrame);
		return () => {
			if (handleRequestFrameRef.current !== null) {
				cancelAnimationFrame(handleRequestFrameRef.current);
			}
		};
	}, [settings, handleRequestFrame]);

	useEffect(() => {
		updateState(time);
	}, [time, updateState]);

	return (
		<ZenModeSessionContext.Provider
			value={{ time, state, addMinutes, advanceToNextState, settings }}
		>
			{children}
		</ZenModeSessionContext.Provider>
	);
};

export const useZenModeSession = () => {
	const context = useContext(ZenModeSessionContext);
	if (!context) {
		throw new Error(
			"useZenModeSession must be used within a ZenModeSessionProvider",
		);
	}
	return context;
};
