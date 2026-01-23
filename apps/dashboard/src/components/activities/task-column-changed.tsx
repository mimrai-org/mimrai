"use client";

import type { RouterOutputs } from "@mimir/trpc";
import { BaseActivity } from "./base-activity";

type Activity = RouterOutputs["activities"]["get"]["data"][number];

interface TaskColumnChangedActivityProps {
	activity: Activity;
}

export const TaskColumnChangedActivity = ({
	activity,
}: TaskColumnChangedActivityProps) => {
	const metadata = activity.metadata as { toColumnName?: string };

	return (
		<BaseActivity activity={activity}>
			moved the task to {metadata?.toColumnName || "another column"}
		</BaseActivity>
	);
};
