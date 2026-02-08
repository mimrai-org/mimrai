"use client";

import { BaseActivity } from "./base-activity";
import type { Activity } from "./types";

interface TaskExecutionStartedActivityProps {
	activity: Activity;
}

export const TaskExecutionStartedActivity = ({
	activity,
}: TaskExecutionStartedActivityProps) => {
	if (!activity.user) return null;

	return (
		<BaseActivity activity={activity}>started working in the task</BaseActivity>
	);
};
