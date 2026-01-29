"use client";

import type { RouterOutputs } from "@mimir/trpc";
import { createContext, useContext } from "react";
import { ChecklistItemCreatedActivity } from "./checklist-item-created";
import { DailyTeamSummaryActivity } from "./daily-team-summary";
import { MentionActivity } from "./mention";
import { TaskAssignedActivity } from "./task-assigned";
import { TaskColumnChangedActivity } from "./task-column-changed";
import { TaskCommentActivity } from "./task-comment";
import { TaskCompletedActivity } from "./task-completed";
import { TaskCreatedActivity } from "./task-created";
import { TaskUpdatedActivity } from "./task-updated";
import type { Activity } from "./types";
import { UnknownActivity } from "./unknown-activity";

interface ActivityItemProps {
	activity: Activity;
	taskId?: string;
}

export const ActivityItemContainer = ({
	activity,
	taskId,
}: ActivityItemProps) => {
	switch (activity.type) {
		case "task_created":
			return <TaskCreatedActivity activity={activity} />;
		case "task_assigned":
			return <TaskAssignedActivity activity={activity} />;
		case "task_column_changed":
			return <TaskColumnChangedActivity activity={activity} />;
		case "task_updated":
			return <TaskUpdatedActivity activity={activity} />;
		case "task_comment":
			return (
				<TaskCommentActivity
					activity={activity}
					taskId={taskId || activity.groupId!}
				/>
			);
		case "mention":
			return <MentionActivity activity={activity} />;
		case "checklist_item_created":
			return <ChecklistItemCreatedActivity activity={activity} />;
		case "daily_team_summary":
			return <DailyTeamSummaryActivity activity={activity} />;
		case "task_completed":
			return <TaskCompletedActivity activity={activity} />;
		default:
			return <UnknownActivity activity={activity} />;
	}
};

export const ActivityItem = ({
	activity,
	taskId,
	...contextValues
}: ActivityItemProps & ActivityItemContextValue) => {
	return (
		<ActivityItemProvider value={contextValues}>
			<ActivityItemContainer activity={activity} taskId={taskId} />
		</ActivityItemProvider>
	);
};

interface ActivityItemContextValue {
	showGroupInfo?: boolean;
}

export const ActivityItemContext =
	createContext<null | ActivityItemContextValue>(null);

export const ActivityItemProvider = ActivityItemContext.Provider;

export const useActivityItemContext = () => {
	const context = useContext(ActivityItemContext);
	if (!context) {
		throw new Error(
			"useActivityItemContext must be used within an ActivityItemProvider",
		);
	}
	return context;
};
