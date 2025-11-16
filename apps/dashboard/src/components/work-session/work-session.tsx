"use client";
import type { RouterOutputs } from "@api/trpc/routers";
import { Button } from "@ui/components/ui/button";
import { useSidebar } from "@ui/components/ui/sidebar";
import { CheckIcon, ClockIcon, SquareStopIcon } from "lucide-react";
import { useEffect } from "react";
import { useWorkSessionStore } from "./store";

export const WorkSession = ({
	task,
}: {
	task: RouterOutputs["tasks"]["getById"];
}) => {
	if (!task) return null;
	return (
		<div>
			<WorkSessionTimer />
			<WorkSessionStatus />
		</div>
	);
};

export const WorkSessionTimer = () => {
	const { timer, setTimer } = useWorkSessionStore();
	const { setOpen } = useSidebar();

	useEffect(() => {
		const startTime = timer;
		let lastFrameTime = startTime;
		setOpen(false);

		requestAnimationFrame(function updateTimer(t) {
			const offsetTime = startTime + t;
			console.log({
				lastFrameTime,
				offsetTime,
			});
			// Update timer logic here
			if (lastFrameTime < offsetTime - 1000) {
				console.log("Timer updated", Math.round(offsetTime / 1000));
				setTimer(Math.round(offsetTime / 1000));
				lastFrameTime = offsetTime;
			}
			requestAnimationFrame(updateTimer);
		});
	}, []);
	return null;
};

export const WorkSessionStatus = () => {
	const { timer } = useWorkSessionStore();

	const formatTime = (seconds: number) => {
		const hrs = Math.floor(seconds / 3600);
		const mins = Math.floor(seconds / 60);
		const secs = seconds;

		if (secs < 60) {
			return `${secs}s`;
		}
		if (mins < 60) {
			return `${mins}m ${secs % 60}s`;
		}
		return `${hrs}h ${mins % 60}m`;
	};

	return (
		<div className="flex items-center justify-between bg-background px-4 py-2 invert">
			<div className="flex gap-1 text-muted-foreground text-xs">
				<ClockIcon className="size-3.5" /> {formatTime(timer)}
			</div>
			<div className="flex gap-2">
				<Button variant={"ghost"} size={"sm"}>
					<SquareStopIcon />
					End Session
				</Button>
				<Button size={"sm"}>
					<CheckIcon />
					Mark as Done
				</Button>
			</div>
		</div>
	);
};
