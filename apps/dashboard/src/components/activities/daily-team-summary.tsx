"use client";

import type { RouterOutputs } from "@mimir/trpc";
import { AssigneeAvatar } from "@/components/asignee-avatar";
import { ActivityReactions } from "./activity-reactions";
import type { Activity } from "./types";

interface DailyTeamSummaryActivityProps {
	activity: Activity;
}

export const DailyTeamSummaryActivity = ({
	activity,
}: DailyTeamSummaryActivityProps) => {
	if (!activity.user) return null;

	const summary = activity.metadata?.content.split("\n")?.reverse()?.[1];
	if (!summary) return null;

	return (
		<div className="space-y-4 rounded-sm border border-dashed p-4 text-muted-foreground">
			<div className="group flex items-center gap-2">
				<AssigneeAvatar {...activity.user} className="size-4 text-xs" />
				<span className="font-medium text-xs">{activity.user.name}</span>
				<ActivityReactions
					activityId={activity.id}
					reactions={activity.reactions}
				/>
			</div>
			<div className="whitespace-pre-wrap text-xs">{summary}</div>
		</div>
	);
};
