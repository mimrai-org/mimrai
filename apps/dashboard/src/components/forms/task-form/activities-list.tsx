"use client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import { AnimatePresence } from "motion/react";
import { useMemo, useState } from "react";
import { ActivityItem } from "@/components/activities/activity-item";
import { trpc } from "@/utils/trpc";

export const TaskActivitiesList = ({ taskId }: { taskId: string }) => {
	const [showAll, setShowAll] = useState(false);
	const { data } = useQuery(
		trpc.activities.get.queryOptions({
			groupId: taskId,
			nStatus: ["archived"],
			pageSize: 100,
		}),
	);

	const reversedData = useMemo(() => {
		if (!data) return [];
		return [...data.data].reverse();
	}, [data]);

	const canShowAll = reversedData.length < 10 || showAll;

	const dataToShow = useMemo(() => {
		if (canShowAll) {
			return reversedData;
		}
		const comments = reversedData.filter(
			(activity) => activity.type === "task_comment",
		);

		if (comments.length >= 3) {
			return comments;
		}

		return reversedData.slice(-3);
	}, [reversedData, canShowAll]);

	return (
		<ul className="space-y-2">
			{!canShowAll && (
				<li>
					<Button
						variant={"ghost"}
						size={"sm"}
						className="text-muted-foreground text-xs"
						onClick={() => setShowAll(true)}
					>
						Show all activities...
					</Button>
				</li>
			)}
			<AnimatePresence>
				{dataToShow.map((activity) => {
					return (
						<li key={activity.id}>
							<ActivityItem
								key={activity.id}
								activity={activity}
								taskId={taskId}
							/>
						</li>
					);
				})}
			</AnimatePresence>
		</ul>
	);
};
