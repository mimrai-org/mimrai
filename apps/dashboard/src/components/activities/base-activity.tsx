"use client";

import type { RouterOutputs } from "@mimir/trpc";
import { formatRelative } from "date-fns";
import { DotIcon } from "lucide-react";
import { AssigneeAvatar } from "@/components/asignee-avatar";
import { ActivityReactions } from "./activity-reactions";

type Activity = RouterOutputs["activities"]["get"]["data"][number];

interface BaseActivityProps {
	activity: Activity;
	children: React.ReactNode;
	showReactions?: boolean;
}

export const BaseActivity = ({
	activity,
	children,
	showReactions = true,
}: BaseActivityProps) => {
	if (!activity.user) return null;

	return (
		<div className="group flex flex-wrap items-center px-4 text-muted-foreground text-xs">
			<AssigneeAvatar {...activity.user} className="mr-2 size-4 text-xs" />
			<span className="mr-1 font-medium">{activity.user.name}</span>
			{children}
			<DotIcon />
			{formatRelative(new Date(activity.createdAt!), new Date())}
			{showReactions && (
				<ActivityReactions
					activityId={activity.id}
					reactions={activity.reactions}
				/>
			)}
		</div>
	);
};
