"use client";

import type { RouterOutputs } from "@mimir/trpc";
import { formatRelative } from "date-fns";
import { DotIcon } from "lucide-react";
import { AssigneeAvatar } from "@/components/asignee-avatar";
import { ActivityReactions } from "./activity-reactions";
import { BaseActivity } from "./base-activity";
import type { Activity } from "./types";

interface TaskCompletedActivityProps {
	activity: Activity;
}

export const TaskCompletedActivity = ({
	activity,
}: TaskCompletedActivityProps) => {
	if (!activity.user) return null;

	return <BaseActivity activity={activity}>completed a task</BaseActivity>;
};
