"use client";

import { useQuery } from "@tanstack/react-query";
import { format, isToday, isYesterday } from "date-fns";
import { trpc } from "@/utils/trpc";
import { ActivityItem as TaskActivityItem } from "../forms/task-form/activities-list";
import { useUser } from "../user-provider";

export const FeedView = () => {
	const user = useUser();

	const { data: activities, isLoading } = useQuery(
		trpc.activities.get.queryOptions({
			onlyForUser: true,
			type: ["task_assigned", "task_comment", "mention"],
			pageSize: 20,
		}),
	);

	if (isLoading) {
		return <div>Loading...</div>;
	}

	if (!activities?.data.length) {
		return <div>No activities yet.</div>;
	}

	const groupedActivities = activities.data.reduce(
		(acc, activity) => {
			const date = new Date(activity.createdAt);
			let key: string;
			if (isToday(date)) {
				key = "Today";
			} else if (isYesterday(date)) {
				key = "Yesterday";
			} else {
				key = format(date, "MMMM d, yyyy");
			}
			if (!acc[key]) {
				acc[key] = [];
			}
			acc[key].push(activity);
			return acc;
		},
		{} as Record<string, typeof activities.data>,
	);

	return (
		<div className="space-y-6 py-4">
			{Object.entries(groupedActivities).map(([date, acts]) => (
				<div key={date}>
					<h2 className="mb-4 font-header">{date}</h2>
					<div className="space-y-2">
						{acts.map((activity) => (
							<div key={activity.id}>
								<TaskActivityItem key={activity.id} activity={activity} />
							</div>
						))}
					</div>
				</div>
			))}
		</div>
	);
};
