"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { format, isToday, isYesterday } from "date-fns";
import { LayersIcon } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { trpc } from "@/utils/trpc";
import { ActivityItem as TaskActivityItem } from "../forms/task-form/activities-list";
import Loader from "../loader";
import { useUser } from "../user-provider";

export const FeedView = () => {
	const user = useUser();
	const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
		useInfiniteQuery(
			trpc.activities.get.infiniteQueryOptions(
				{
					type: ["task_assigned", "task_comment", "mention"],
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
					<div className="space-y-8">
						{acts.map((activity) => (
							<div key={activity.id} className="">
								<TaskActivityItem key={activity.id} activity={activity} />
								{activity.task && (
									<div className="mt-2 flex items-center gap-2 ps-4 text-muted-foreground text-xs">
										<Link
											href={`${user.basePath}/tasks/${activity.task?.id}`}
											className="flex items-center gap-1"
										>
											<LayersIcon className="size-3.5" />
											{activity.task?.title}
										</Link>
									</div>
								)}
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
