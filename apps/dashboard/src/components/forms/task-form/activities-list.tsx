"use client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useSubscription } from "@trpc/tanstack-react-query";
import { Button } from "@ui/components/ui/button";
import { AnimatePresence } from "motion/react";
import { useMemo } from "react";
import { ActivityItem } from "@/components/activities/activity-item";
import { useChannelName, useRealtime } from "@/lib/realtime-client";
import { queryClient, trpc, trpcClient } from "@/utils/trpc";

export const TaskActivitiesList = ({ taskId }: { taskId: string }) => {
	const { data, fetchNextPage, hasNextPage } = useInfiniteQuery(
		trpc.activities.get.infiniteQueryOptions(
			{
				groupId: taskId,
				nStatus: ["archived"],
				pageSize: 10,
			},
			{
				getNextPageParam: (lastPage) => lastPage.meta.cursor,
			},
		),
	);

	const reversedData = useMemo(() => {
		if (!data) return [];
		return [...data.pages.flatMap((page) => page.data)].reverse();
	}, [data]);

	return (
		<ul className="space-y-2">
			{hasNextPage && (
				<li>
					<Button
						variant={"ghost"}
						size={"sm"}
						className="text-muted-foreground text-xs"
						onClick={() => fetchNextPage()}
						type="button"
					>
						Load more activities
					</Button>
				</li>
			)}
			<AnimatePresence>
				{reversedData.map((activity) => {
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
