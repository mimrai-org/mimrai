"use client";

import { t } from "@mimir/locale";
import type { RouterOutputs } from "@mimir/trpc";
import { BaseActivity } from "./base-activity";
import type { Activity } from "./types";

interface TaskUpdatedActivityProps {
	activity: Activity;
}

export const TaskUpdatedActivity = ({ activity }: TaskUpdatedActivityProps) => {
	const metadata = activity.metadata as {
		changes: Record<string, { value: string }>;
	};

	let message = "updated the task";
	if (metadata?.changes) {
		const propertiesChanged = Object.keys(metadata.changes);
		if (propertiesChanged.length > 0) {
			message = `updated the ${propertiesChanged.map((key) => t(`activities.changes.${key}`)).join(", ")}`;
		}
	}

	return <BaseActivity activity={activity}>{message}</BaseActivity>;
};
