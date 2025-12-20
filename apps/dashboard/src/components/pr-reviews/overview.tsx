import { Button } from "@ui/components/ui/button";
import { ExternalLinkIcon } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useTaskParams } from "@/hooks/use-task-params";
import { useUser } from "@/hooks/use-user";
import { Response } from "../chat/response";
import { PrReviewStateIcon } from "./status";
import { usePrReviews } from "./use-pr-reviews";

export const PrReviewsOverview = () => {
	const user = useUser();
	const { currentPr } = usePrReviews();
	const { setParams: setTaskParams } = useTaskParams();

	if (!currentPr) {
		return null;
	}

	return (
		<motion.div
			initial={{
				width: "40%",
				opacity: 0,
			}}
			animate={{
				width: "66.6667%",
				opacity: 1,
			}}
			transition={{ duration: 0.2 }}
			className="border-l p-4"
		>
			<div className="flex items-start justify-between gap-4 rounded-sm bg-card px-4 py-2">
				<div className="flex flex-col gap-1">
					<h2 className="flex items-start gap-2 text-base">
						<span className="text-muted-foreground">#{currentPr.prNumber}</span>
						<span className="font-medium">{currentPr.title}</span>
					</h2>
					<div className="flex items-center gap-2 text-muted-foreground text-xs capitalize">
						<PrReviewStateIcon
							state={currentPr.state}
							draft={currentPr.draft}
							merged={currentPr.merged}
							className="size-4"
						/>
						{currentPr.state}
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Link
						href={currentPr.prUrl}
						target="_blank"
						rel="noopener noreferrer"
					>
						<Button className="text-xs" variant={"ghost"} size="sm">
							<ExternalLinkIcon className="size-3.5" />
							View on GitHub
						</Button>
					</Link>
				</div>
			</div>

			<div className="mt-4">
				{currentPr.tasks && currentPr.tasks.length > 0 && (
					<div className="space-y-2">
						{currentPr.tasks.map((task) => (
							<button
								type="button"
								key={task.id}
								className="w-full rounded-sm px-3 py-2 text-left text-sm hover:bg-accent/30"
								onClick={() => {
									setTaskParams({ taskId: task.id });
								}}
							>
								<span className="text-muted-foreground">
									{user?.team?.prefix}-{task.sequence}
								</span>{" "}
								{task.title}
							</button>
						))}
					</div>
				)}
			</div>

			<div className="p-4 text-sm">
				<Response>{currentPr.body || "No description provided."}</Response>
			</div>
		</motion.div>
	);
};
