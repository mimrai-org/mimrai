"use client";

import { BaseActivity } from "./base-activity";
import type { Activity } from "./types";

interface TaskExecutionCompletedActivityProps {
	activity: Activity;
}

export const TaskExecutionCompletedActivity = ({
	activity,
}: TaskExecutionCompletedActivityProps) => {
	if (!activity.user) return null;

	return (
		<BaseActivity activity={activity}>
			finished working on the task
		</BaseActivity>
	);
};
