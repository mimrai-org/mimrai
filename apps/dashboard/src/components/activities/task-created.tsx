"use client";

import type { RouterOutputs } from "@mimir/trpc";
import { BaseActivity } from "./base-activity";

type Activity = RouterOutputs["activities"]["get"]["data"][number];

interface TaskCreatedActivityProps {
	activity: Activity;
}

export const TaskCreatedActivity = ({ activity }: TaskCreatedActivityProps) => {
	return <BaseActivity activity={activity}>created the task</BaseActivity>;
};
