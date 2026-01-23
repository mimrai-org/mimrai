"use client";

import type { RouterOutputs } from "@mimir/trpc";
import { formatRelative } from "date-fns";
import { DotIcon } from "lucide-react";
import { AssigneeAvatar } from "@/components/asignee-avatar";
import { ActivityReactions } from "./activity-reactions";

type Activity = RouterOutputs["activities"]["get"]["data"][number];

interface ChecklistItemCreatedActivityProps {
	activity: Activity;
}

export const ChecklistItemCreatedActivity = ({
	activity,
}: ChecklistItemCreatedActivityProps) => {
	if (!activity.user) return null;

	return (
		<div className="group flex items-center px-4 text-muted-foreground text-xs">
			<AssigneeAvatar {...activity.user} className="mr-2 size-4 text-xs" />
			<span className="mr-1 font-medium">{activity.user.name}</span>
			created a checklist item
			<DotIcon />
			{formatRelative(new Date(activity.createdAt!), new Date())}
			<ActivityReactions
				activityId={activity.id}
				reactions={activity.reactions}
			/>
		</div>
	);
};
