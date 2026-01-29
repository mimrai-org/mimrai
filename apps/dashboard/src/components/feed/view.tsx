"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { cn } from "@ui/lib/utils";
import { format, isToday, isYesterday } from "date-fns";
import { LayersIcon } from "lucide-react";
import { useEffect } from "react";
import { ActivityItem } from "@/components/activities/activity-item";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { trpc } from "@/utils/trpc";
import Loader from "../loader";
import { useTaskPanel } from "../panels/task-panel";

const highlightedTypes = ["task_comment", "mention", "daily_team_summary"];

export const FeedView = () => {
	const taskPanel = useTaskPanel();
	const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
		useInfiniteQuery(
			trpc.activities.get.infiniteQueryOptions(
				{
					type: [
						"task_assigned",
						"task_comment",
						"task_completed",
						"mention",
						"daily_team_summary",
					],
					pageSize: 10,
				},
				{
					getNextPageParam: (lastPage) => lastPage.meta.cursor,
				},
			),
		);

	const { ref, hasIntersected, reset } =
		useIntersectionObserver<HTMLDivElement>({
			threshold: 0.1,
			rootMargin: "100px",
		});

	useEffect(() => {
		if (hasIntersected && hasNextPage && !isFetchingNextPage) {
			fetchNextPage();
			reset();
		}
	}, [hasIntersected, hasNextPage, isFetchingNextPage, fetchNextPage, reset]);

	const activities = data?.pages.flatMap((page) => page.data) ?? [];

	if (isLoading && activities.length === 0) {
		return <div>Loading...</div>;
	}

	if (activities.length === 0) {
		return (
			<div className="text-muted-foreground text-sm">No activities yet.</div>
		);
	}

	const groupedActivities = activities.reduce(
		(acc: Record<string, typeof activities>, activity) => {
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
		{},
	);

	return (
		<div className="space-y-6 py-4">
			{Object.entries(groupedActivities).map(([date, acts]) => (
				<div key={date}>
					<h2 className="mb-4 font-header">{date}</h2>
					<div className="space-y-4">
						{acts.map((activity) => (
							<div key={activity.id} className={cn("rounded-sm")}>
								<ActivityItem
									key={activity.id}
									activity={activity}
									showGroupInfo
								/>
							</div>
						))}
					</div>
				</div>
			))}
			{hasNextPage && (
				<div ref={ref} className="flex justify-center py-4">
					{isFetchingNextPage ? <Loader /> : <div className="w- h-6" />}
				</div>
			)}
		</div>
	);
};
