"use client";
import type { RouterOutputs } from "@api/trpc/routers";
import { t } from "@mimir/locale";
import { useQuery } from "@tanstack/react-query";
import { formatRelative } from "date-fns";
import { DotIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo } from "react";
import { AssigneeAvatar } from "@/components/kanban/asignee";
import { trpc } from "@/utils/trpc";

export const TaskActivitiesList = ({ taskId }: { taskId: string }) => {
	const { data } = useQuery(
		trpc.activities.get.queryOptions({
			groupId: taskId,
			pageSize: 100,
		}),
	);

	const reversedData = useMemo(() => {
		if (!data) return [];
		return [...data.data].reverse();
	}, [data]);

	return (
		<ul className="space-y-2">
			<AnimatePresence>
				{reversedData.map((activity) => {
					return (
						<motion.li
							key={activity.id}
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.2 }}
							layout
							layoutId={`activity-${activity.id}`}
						>
							<ActivityItem activity={activity} />
						</motion.li>
					);
				})}
			</AnimatePresence>
		</ul>
	);
};

const ActivityItem = ({
	activity,
}: {
	activity: RouterOutputs["activities"]["get"]["data"][number];
}) => {
	if (!activity.user) return null;

	switch (activity.type) {
		case "task_created":
			return (
				<div className="flex items-center px-4 text-muted-foreground text-xs">
					<AssigneeAvatar {...activity.user} className="mr-2 size-4 text-xs" />
					<span className="mr-1 font-medium">{activity.user!.name}</span>
					created the task
					<DotIcon />
					{formatRelative(new Date(activity.createdAt!), new Date())}
				</div>
			);
		case "task_updated": {
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
			return (
				<div className="flex items-center px-4 text-muted-foreground text-xs">
					<AssigneeAvatar {...activity.user} className="mr-2 size-4 text-xs" />
					<span className="mr-1 font-medium">{activity.user!.name}</span>
					{message}
					<DotIcon />
					{formatRelative(new Date(activity.createdAt!), new Date())}
				</div>
			);
		}
		case "task_comment": {
			const metadata = activity.metadata as { comment: string };
			return (
				<div className="space-y-1 border px-4 py-4 text-muted-foreground text-sm">
					<div className="flex items-center text-muted-foreground text-xs">
						<AssigneeAvatar
							{...activity.user}
							className="mr-2 size-4 text-xs"
						/>
						<span className="mr-1 font-medium">{activity.user!.name}</span>
						<DotIcon />
						{formatRelative(new Date(activity.createdAt!), new Date())}
					</div>
					<div className="whitespace-pre-wrap break-words pt-1 text-foreground">
						{metadata.comment}
					</div>
				</div>
			);
		}
		default:
			return null;
	}
};
