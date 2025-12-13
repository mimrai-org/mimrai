"use client";
import type { RouterOutputs } from "@api/trpc/routers";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import { motion } from "framer-motion";
import { PencilIcon, QuoteIcon, SkipForwardIcon, XIcon } from "lucide-react";
import { redirect, useRouter } from "next/navigation";
import { useRef } from "react";
import { useTaskParams } from "@/hooks/use-task-params";
import { useUser } from "@/hooks/use-user";
import { trpc } from "@/utils/trpc";
import { Response } from "../chat/response";
import { PriorityIcon } from "../tasks-view/properties/priority";
import { ZenModeAttachments } from "./attachments";
import { ZenModeChecklist } from "./checklists";
import { ZenModeDoneButton } from "./done-button";
import { ZenModeLabels } from "./labels";
import { ZenModeLoading } from "./loading";
import { ZenModeNotFound } from "./not-found";
import { ZenModeQueue } from "./queue";
import { ZenModeScrollSpy } from "./scroll-spy";
import { ZenModeWhyButton } from "./why-button";

export type ZenModeTasks = RouterOutputs["tasks"]["get"]["data"];
export type ZenModeTask = ZenModeTasks[number];

export const ZenModeView = ({ taskId }: { taskId: string }) => {
	const { setParams } = useTaskParams();
	const contentRef = useRef<HTMLDivElement>(null);
	const router = useRouter();
	const user = useUser();

	const { data: tasks, isLoading } = useQuery(
		trpc.tasks.get.queryOptions(
			{
				assigneeId: [user?.id || ""],
				statusType: ["to_do", "in_progress"],
				view: "board",
				pageSize: 10,
			},
			{ enabled: !!user?.id },
		),
	);

	// Handle loading state
	if (isLoading) {
		return <ZenModeLoading />;
	}

	if (!tasks || tasks.data.length === 0) {
		return <ZenModeNotFound />;
	}

	const currentTask = tasks.data.find((task) => task.id === taskId);

	const handleNext = () => {
		if (!currentTask) return;
		const nextTaskIndex =
			tasks.data.findIndex((task) => task.id === currentTask!.id) + 1;
		if (nextTaskIndex < tasks.data.length) {
			const nextTask = tasks.data[nextTaskIndex]!;
			router.push(`${user?.basePath}/zen/${nextTask.id}`);
		} else {
			router.push(`${user?.basePath}/board`);
		}
	};

	if (!currentTask) {
		if (tasks.data.length > 0) {
			// If the current task is not found, redirect to the first task in the list
			return redirect(`${user?.basePath}/zen/${tasks.data[0]!.id}`);
		}

		if (!currentTask) return <ZenModeNotFound />;
	}

	return (
		<>
			<ZenModeClose />
			<ZenModeQueue currentTaskId={taskId} tasks={tasks.data} />
			<ZenModeScrollSpy task={currentTask} contentRef={contentRef} />
			<motion.div
				initial={{ opacity: 0, scale: 0.95, filter: "blur(8px)" }}
				animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
				exit={{ opacity: 0, scale: 0.95, filter: "blur(8px)" }}
				transition={{ duration: 0.2 }}
				className="flex flex-col items-center space-y-4 px-2 sm:px-4"
			>
				<div className="flex items-center gap-2 rounded-full border px-2 py-2 text-xs uppercase sm:w-fit sm:px-4">
					{PriorityIcon[currentTask.priority]}
					{currentTask.priority}
				</div>
				<h1 className="px-2 text-center text-3xl sm:px-4 sm:text-6xl">
					{currentTask.title}
				</h1>
				<div className="mb-0">
					<ZenModeLabels {...currentTask} />
				</div>
				<div className="my-6 h-px w-full bg-gradient-to-r from-transparent via-muted to-transparent" />
				<div
					className="relative self-start px-2 text-start text-muted-foreground text-sm leading-6 sm:px-4 sm:text-lg sm:leading-7"
					ref={contentRef}
				>
					<div className="-left-12 absolute top-0 hidden text-zinc-800 md:block">
						<QuoteIcon className="h-8 w-8 opacity-20" />
					</div>
					<Response>{currentTask.description}</Response>
				</div>
				<ZenModeAttachments task={currentTask} />
				<ZenModeChecklist task={currentTask} />
				<div className="mt-8 flex flex-col items-center gap-4 sm:flex-row">
					<Button
						className="size-10 rounded-full"
						variant={"ghost"}
						onClick={() => {
							setParams({
								taskId: currentTask.id,
							});
						}}
					>
						<PencilIcon />
					</Button>
					<Button
						variant={"outline"}
						className="rounded-full bg-transparent text-sm hover:scale-105 sm:text-base dark:bg-transparent"
						size={"xl"}
						onClick={handleNext}
					>
						<SkipForwardIcon />
						Skip
					</Button>
					<ZenModeDoneButton task={currentTask} handleNext={handleNext} />
				</div>
				<div className="mt-4">
					<ZenModeWhyButton task={currentTask} />
				</div>
			</motion.div>
		</>
	);
};

export const ZenModeClose = () => {
	const router = useRouter();
	const user = useUser();

	const handleExit = () => {
		router.push(`${user?.basePath}/board`);
	};

	return (
		<button
			type="button"
			className="group absolute top-4 left-4 flex items-center gap-1 rounded-full px-3 py-1 font-medium text-muted-foreground text-sm transition-colors hover:bg-muted/30"
			onClick={handleExit}
		>
			<div className="flex size-4.5 items-center justify-center rounded-sm border bg-muted/30 transition-colors group-hover:border-foreground group-hover:text-foreground">
				<XIcon className="size-3" />
			</div>
			Exit Focus
		</button>
	);
};
