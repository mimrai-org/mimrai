"use client";

import type { RouterOutputs } from "@mimir/trpc";
import { ChecklistItemCreatedActivity } from "./checklist-item-created";
import { DailyTeamSummaryActivity } from "./daily-team-summary";
import { MentionActivity } from "./mention";
import { TaskAssignedActivity } from "./task-assigned";
import { TaskColumnChangedActivity } from "./task-column-changed";
import { TaskCommentActivity } from "./task-comment";
import { TaskCreatedActivity } from "./task-created";
import { TaskUpdatedActivity } from "./task-updated";
import { UnknownActivity } from "./unknown-activity";

type Activity = RouterOutputs["activities"]["get"]["data"][number];

interface ActivityItemProps {
	activity: Activity;
	taskId?: string;
}

export const ActivityItem = ({ activity, taskId }: ActivityItemProps) => {
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
		default:
			return <UnknownActivity activity={activity} />;
	}
};
