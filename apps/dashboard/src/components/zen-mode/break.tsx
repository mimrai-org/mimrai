import { Button } from "@ui/components/ui/button";
import { differenceInMinutes } from "date-fns";
import { PlayIcon } from "lucide-react";
import { AnimatePresence, motion, stagger } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@/components/user-provider";
import { useZenModeSession } from "./use-zen-mode-session";

const container = {
	hidden: { opacity: 0, scale: 0.95, filter: "blur(8px)" },
	show: { opacity: 1, scale: 1, filter: "blur(0px)" },
};

const defaultItem = {
	hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
	show: { opacity: 1, y: 0, filter: "blur(0px)" },
};

const bgColors = {
	break:
		"dark:from-background dark:via-stone-800 dark:to-neutral-900 from-background via-stone-600 to-neutral-100",
	focus:
		"dark:from-background dark:via-neutral-800 dark:to-neutral-900 from-background via-neutral-700 to-neutral-100",
};

export const ZenModeBreak = () => {
	const user = useUser();
	const { state, advanceToNextState, settings } = useZenModeSession();
	const [internalState, setInternalState] = useState(state);
	const isFocused = useRef(true);
	const latestStateRef = useRef(state);
	const canResumeWork =
		!settings?.settings?.focusGuard.requireBreaks || state === "focus";
	const lastZenModeAt = settings?.lastZenModeAt;

	const breakNotificationRef = useRef<Notification | null>(null);
	const focusNotificationRef = useRef<Notification | null>(null);

	const handleNotification = async (type: "break" | "focus") => {
		if (!("Notification" in window)) {
			// Notifications not supported
			return;
		}

		if (Notification.permission !== "denied") {
			// We need to ask the user for permission
			await Notification.requestPermission();
		}

		if (Notification.permission !== "granted") {
			// Notifications not granted
			return;
		}

		if (isFocused.current) {
			// Don't send notification if content is visible
			return;
		}

		closeNotifications();
		if (type === "break") {
			breakNotificationRef.current = new Notification(
				"Time for a short break 🌿",
				{
					body: "Take a short break to relax and recharge.",
				},
			);
		} else if (type === "focus") {
			focusNotificationRef.current = new Notification(
				"You can return to focus whenever you're ready",
				{
					body: "Hope you had a refreshing break!",
				},
			);
		}
	};

	useEffect(() => {
		if (latestStateRef.current !== state && state === "break") {
			// prevent auto pass from break to focus on re-renders
			// break state entered
			handleNotification("break");
			setInternalState(state);
		}

		if (latestStateRef.current !== state && state === "focus") {
			// focus state entered
			handleNotification("focus");
		}

		latestStateRef.current = state;
	}, [state]);

	const closeNotifications = () => {
		breakNotificationRef.current?.close();
		focusNotificationRef.current?.close();
	};

	useEffect(() => {
		const handleFocus = () => {
			closeNotifications();
			isFocused.current = true;
		};
		const handleBlur = () => {
			isFocused.current = false;
		};
		window.addEventListener("focus", handleFocus);
		window.addEventListener("blur", handleBlur);
		return () => {
			window.removeEventListener("focus", handleFocus);
			window.removeEventListener("blur", handleBlur);
		};
	}, []);

	return (
		<AnimatePresence>
			{internalState === "break" && (
				<motion.div
					className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-background p-4"
					initial="hidden"
					animate="show"
					exit={"hidden"}
					variants={container}
					transition={{
						delayChildren: stagger(0.4),
						duration: 0.6,
					}}
				>
					<div
						className={`-translate-x-1/2 -translate-y-1/2 pointer-events-none absolute top-1/2 left-1/2 aspect-square size-[4000px] bg-radial-[50%_50%] transition-colors duration-[30000] ${bgColors[state]} opacity-50`}
					/>

					<div />

					<div className="flex flex-col items-center justify-center">
						<motion.h1
							variants={defaultItem}
							className="mt-8 text-center font-thin text-4xl"
						>
							Time for a short break
						</motion.h1>
						<motion.p
							variants={defaultItem}
							className="mt-2 text-center font-light text-base text-muted-foreground"
						>
							Remember to stretch and relax before getting back to work.
						</motion.p>
						<motion.div
							variants={defaultItem}
							className="mt-8 font-light text-muted-foreground text-sm"
						>
							You focused for&nbsp;
							<span className="font-mono">
								{differenceInMinutes(
									new Date(),
									lastZenModeAt ? new Date(lastZenModeAt) : new Date(),
								)}
							</span>
							&nbsp;minutes
						</motion.div>

						<motion.div
							variants={defaultItem}
							className="mt-4 flex flex-col items-center justify-center"
						>
							<Button
								size={"lg"}
								className="rounded-full font-normal transition-all hover:scale-105"
								onClick={() => {
									setInternalState("focus");
									advanceToNextState("focus");
								}}
								disabled={!canResumeWork}
								variant={"secondary"}
								type="button"
							>
								Resume Work
								<PlayIcon />
							</Button>
						</motion.div>
					</div>

					<div className="h-12">
						{!canResumeWork && (
							<p className="mt-2 max-w-sm text-center text-muted-foreground text-xs">
								This break is required to help you recover before continuing.
								You can adjust this setting in your{" "}
								<Link
									href={`${user?.basePath}/settings/zen`}
									className="underline hover:text-foreground"
								>
									zen mode settings
								</Link>
								.
							</p>
						)}
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
};
