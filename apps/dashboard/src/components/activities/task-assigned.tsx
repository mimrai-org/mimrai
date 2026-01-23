"use client";

import type { RouterOutputs } from "@mimir/trpc";
import { BaseActivity } from "./base-activity";

type Activity = RouterOutputs["activities"]["get"]["data"][number];

interface TaskAssignedActivityProps {
	activity: Activity;
}

export const TaskAssignedActivity = ({
	activity,
}: TaskAssignedActivityProps) => {
	const metadata = activity.metadata as { assigneeName?: string };

	return (
		<BaseActivity activity={activity}>
			assigned the task to {metadata?.assigneeName || "someone"}
		</BaseActivity>
	);
};
