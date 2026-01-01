"use client";
import { Button } from "@ui/components/ui/button";
import { cn } from "@ui/lib/utils";
import { BugIcon } from "lucide-react";
import { useState } from "react";
import { useZenModeSession } from "./use-zen-mode-session";

export const ZenModeDevTools = () => {
	const [open, setOpen] = useState(false);
	const { time, state, addMinutes, advanceToNextState } = useZenModeSession();

	return (
		<>
			<Button
				onClick={() => setOpen(!open)}
				type="button"
				className="fixed right-4 bottom-4 z-50 size-8 rounded-full"
			>
				<BugIcon />
			</Button>
			<div
				className={cn(
					"fixed right-4 bottom-4 z-50 rounded-md bg-background p-4 text-background-foreground shadow-md invert",
					{
						hidden: !open,
					},
				)}
			>
				<div className="mb-2 flex items-center justify-between font-bold">
					<span>Zen Mode DevTools</span>
					<Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
						&times;
					</Button>
				</div>
				<div>
					Focus Time: {Math.round((time / 1000 / 60) * 100) / 100} minutes
				</div>
				<div>Current State: {state}</div>
				<div className="mt-2 grid grid-cols-2 gap-2">
					<Button onClick={() => addMinutes(5)} type="button">
						Add 5 Minutes
					</Button>
					<Button onClick={() => addMinutes(-5)} type="button">
						Remove 5 Minutes
					</Button>
					<Button onClick={() => advanceToNextState()} type="button">
						Advance to Next State
					</Button>
				</div>
			</div>
		</>
	);
};
