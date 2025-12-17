"use client";
import { Button } from "@ui/components/ui/button";
import { motion } from "framer-motion";
import { PencilIcon, QuoteIcon, SkipForwardIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTaskParams } from "@/hooks/use-task-params";
import { useUser } from "@/hooks/use-user";
import { Editor } from "../editor";
import { PriorityIcon } from "../tasks-view/properties/priority";
import { ZenModeAttachments } from "./attachments";
import { ZenModeChecklist } from "./checklists";
import { ZenModeContent } from "./content";
import { ZenModeDoneButton } from "./done-button";
import { ZenModeInlineCommentList } from "./inline-comments/list";
import { ZenModeLabels } from "./labels";
import { ZenModeQueue } from "./queue";
import { ZenModeScrollSpy } from "./scroll-spy";
import { useZenMode } from "./use-zen-mode";
import { ZenModeWhyButton } from "./why-button";

export const ZenModeView = ({ taskId }: { taskId: string }) => {
	const { setParams } = useTaskParams();

	const { contentRef, currentTask, next } = useZenMode();

	return (
		<>
			<ZenModeClose />
			<ZenModeQueue />
			<ZenModeScrollSpy />
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
				<ZenModeContent />
				<ZenModeAttachments />
				<ZenModeChecklist />
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
						onClick={next}
					>
						<SkipForwardIcon />
						Skip
					</Button>
					<ZenModeDoneButton />
				</div>
				<div className="mt-4">
					<ZenModeWhyButton />
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
			className="group fixed top-4 left-4 flex items-center gap-1 rounded-full px-3 py-1 font-medium text-muted-foreground text-sm transition-colors hover:bg-muted/30"
			onClick={handleExit}
		>
			<div className="flex size-4.5 items-center justify-center rounded-sm border bg-muted/30 transition-colors group-hover:border-foreground group-hover:text-foreground">
				<XIcon className="size-3" />
			</div>
			Exit Focus
		</button>
	);
};
