"use client";

import type { RouterOutputs } from "@mimir/trpc";
import { BaseActivity } from "./base-activity";
import type { Activity } from "./types";

interface TaskCreatedActivityProps {
	activity: Activity;
}

export const TaskCreatedActivity = ({ activity }: TaskCreatedActivityProps) => {
	return <BaseActivity activity={activity}>created the task</BaseActivity>;
};
