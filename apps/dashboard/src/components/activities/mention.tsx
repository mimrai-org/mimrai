"use client";

import type { RouterOutputs } from "@mimir/trpc";
import { formatRelative } from "date-fns";
import { DotIcon } from "lucide-react";
import { AssigneeAvatar } from "@/components/asignee-avatar";
import { ActivityReactions } from "./activity-reactions";
import type { Activity } from "./types";

interface MentionActivityProps {
	activity: Activity;
}

export const MentionActivity = ({ activity }: MentionActivityProps) => {
	if (!activity.user) return null;

	const metadata = activity.metadata as {
		mentionedUserId: string;
		mentionedUserName: string;
		title: string;
	};

	return (
		<div className="group flex items-center px-4 text-muted-foreground text-xs">
			<AssigneeAvatar {...activity.user} className="mr-2 size-4 text-xs" />
			<span className="mr-1 font-medium">{activity.user.name}</span>
			mentioned{" "}
			<span className="ml-1 font-medium">
				@{metadata.mentionedUserName || "a user"}
			</span>
			<DotIcon />
			{formatRelative(new Date(activity.createdAt!), new Date())}
			<ActivityReactions
				activityId={activity.id}
				reactions={activity.reactions}
			/>
		</div>
	);
};
