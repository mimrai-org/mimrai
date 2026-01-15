import { cn } from "@ui/lib/utils";
import {
	GitPullRequestClosedIcon,
	GitPullRequestDraft,
	GitPullRequestIcon,
} from "lucide-react";
import { useUser } from "@/components/user-provider";
import type { PrReview } from "./use-pr-reviews";

const prReviewsStateIcons = {
	open: (c: string) => (
		<GitPullRequestIcon key="open" className={cn("text-green-600", c)} />
	),
	closed: (c: string) => (
		<GitPullRequestClosedIcon key="closed" className={cn("text-red-600", c)} />
	),
	draft: (c: string) => (
		<GitPullRequestDraft key="draft" className={cn("text-zinc-400", c)} />
	),
	merged: (c: string) => (
		<GitPullRequestIcon key="merged" className={cn("text-purple-600", c)} />
	),
};

export const PrReviewStateIcon = ({
	state,
	draft,
	merged,
	className,
}: {
	state: string;
	draft?: boolean;
	merged?: boolean;
	className?: string;
}) => {
	if (state in prReviewsStateIcons === false) {
		return null;
	}

	const stateKey = draft
		? "draft"
		: merged
			? "merged"
			: (state as keyof typeof prReviewsStateIcons);

	const IconComponent = prReviewsStateIcons[stateKey];
	return IconComponent ? IconComponent(className || "") : null;
};

export const PrReviewStatusText = ({ pr }: { pr: PrReview }) => {
	const user = useUser();

	if (pr.merged) {
		return "Merged";
	}

	if (pr.draft) {
		return "Draft";
	}

	if (pr.state === "closed") {
		return "Closed";
	}

	if (pr.assigneesUserIds?.includes(user?.id || "")) {
		return "Pending review";
	}

	if (pr.reviewersUserIds?.includes(user?.id || "")) {
		return "Review requested";
	}

	return "Open";
};
