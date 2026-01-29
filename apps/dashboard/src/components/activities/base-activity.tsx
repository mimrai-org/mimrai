"use client";

import type { RouterOutputs } from "@mimir/trpc";
import { formatRelative } from "date-fns";
import { DotIcon, LayersIcon } from "lucide-react";
import { AssigneeAvatar } from "@/components/asignee-avatar";
import { useTaskPanel } from "../panels/task-panel";
import { useActivityItemContext } from "./activity-item";
import { ActivityReactions } from "./activity-reactions";
import type { Activity } from "./types";

interface BaseActivityProps {
	activity: Activity;
	children?: React.ReactNode;
	showReactions?: boolean;
	showGroupInfo?: boolean;
}

export const BaseActivity = ({
	activity,
	children,
	showReactions = true,
}: BaseActivityProps) => {
	const { showGroupInfo = false } = useActivityItemContext();

	if (!activity.user) return null;

	return (
		<div className="flex justify-between">
			<div className="group flex flex-wrap items-center px-4 text-muted-foreground text-xs">
				<AssigneeAvatar {...activity.user} className="mr-2 size-4 text-xs" />
				<span className="mr-1 font-medium">{activity.user.name}</span>
				{children}
				<DotIcon />
				{formatRelative(new Date(activity.createdAt!), new Date())}
				{showReactions && (
					<ActivityReactions
						activityId={activity.id}
						reactions={activity.reactions}
					/>
				)}
			</div>
			{showGroupInfo && <BaseActivityGroupInfo activity={activity} />}
		</div>
	);
};

export const BaseActivityGroupInfo = ({ activity }: { activity: Activity }) => {
	const taskPanel = useTaskPanel();

	return (
		<div className="flex items-center px-4 text-muted-foreground text-xs">
			{activity.task && (
				<button
					type="button"
					onClick={() => {
						taskPanel.open(activity.task!.id);
					}}
					className="flex max-w-sm items-center gap-1 text-muted-foreground hover:text-foreground"
				>
					<LayersIcon className="size-3.5" />
					<span className="flex-1 truncate">{activity.task?.title}</span>
				</button>
			)}
		</div>
	);
};
