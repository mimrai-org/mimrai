"use client";

import type { RouterOutputs } from "@mimir/trpc";
import { formatRelative } from "date-fns";
import { DotIcon } from "lucide-react";
import { AssigneeAvatar } from "@/components/asignee-avatar";
import { ActivityReactions } from "./activity-reactions";
import type { Activity } from "./types";

interface TaskCompletedActivityProps {
	activity: Activity;
}

export const TaskCompletedActivity = ({
	activity,
}: TaskCompletedActivityProps) => {
	if (!activity.user) return null;

	// Truly unknown activity type
	return (
		<div className="group flex items-center px-4 text-muted-foreground text-xs">
			<AssigneeAvatar {...activity.user} className="mr-2 size-4 text-xs" />
			<span className="mr-1 font-medium">{activity.user.name}</span>
			completed a task
			<DotIcon />
			{formatRelative(new Date(activity.createdAt!), new Date())}
			<ActivityReactions
				activityId={activity.id}
				reactions={activity.reactions}
			/>
		</div>
	);
};
