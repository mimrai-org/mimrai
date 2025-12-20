"use client";

import { Avatar, AvatarImage } from "@ui/components/ui/avatar";
import { cn } from "@ui/lib/utils";
import { formatRelative } from "date-fns";
import { DotIcon, LayersIcon } from "lucide-react";
import { PrReviewStateIcon, PrReviewStatusText } from "./status";
import { type PrReview, usePrReviews } from "./use-pr-reviews";

export const PrReviewItem = ({ review }: { review: PrReview }) => {
	const { setCurrentPr, currentPr } = usePrReviews();

	const firstAssignee = review.assignees?.[0];

	return (
		<button
			type="button"
			key={review.id}
			className={cn(
				"group w-full space-y-1 rounded-sm px-4 py-2 text-sm transition-colors hover:bg-accent dark:hover:bg-accent/30",
				{
					"bg-accent dark:bg-accent/30": currentPr?.id === review.id,
				},
			)}
			onClick={() => setCurrentPr(review)}
		>
			<div className="flex items-center justify-between gap-4">
				<h3 className="flex max-w-sm gap-2 text-left font-medium">
					<span className="text-muted-foreground">#{review.prNumber}</span>
					<span className="truncate">{review.title}</span>
				</h3>
				<div>
					{firstAssignee && (
						<Avatar className="size-5.5">
							<AvatarImage
								src={firstAssignee.avatarUrl}
								alt={firstAssignee.name}
							/>
						</Avatar>
					)}
				</div>
			</div>
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2 text-muted-foreground text-xs capitalize">
					<PrReviewStateIcon
						state={review.state as any}
						draft={review.draft}
						merged={review.merged}
						className="size-3.5"
					/>
					<PrReviewStatusText pr={review} />
				</div>

				<div className="flex items-center gap-2 text-muted-foreground text-xs">
					{formatRelative(new Date(review.updatedAt), new Date())}
					{review.tasks?.length > 0 && (
						<div className="flex items-center gap-1">
							<LayersIcon className="size-3.5" />
							{review.tasks.length}
						</div>
					)}
				</div>
			</div>
		</button>
	);
};
