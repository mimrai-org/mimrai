"use client";
import type { RouterOutputs } from "@api/trpc/routers";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import {
	CircleCheckIcon,
	CircleDashedIcon,
	CirclePlusIcon,
	LayersIcon,
	SquareCheckIcon,
	SquarePenIcon,
	SquarePlusIcon,
} from "lucide-react";
import { useEffect, useMemo } from "react";
import { useNotificationFilterParams } from "@/hooks/use-notification-filter-params";
import { trpc } from "@/utils/trpc";
import { NotificationItem, type NotificationItemProps } from "./item";
import { useNotificationStore } from "./store";

export const NotificationList = () => {
	const { selectedIds, toggleSelection, clearSelection } =
		useNotificationStore();
	const { setParams, ...params } = useNotificationFilterParams();

	const { data, isLoading, fetchNextPage, hasNextPage } = useInfiniteQuery(
		trpc.activities.get.infiniteQueryOptions(
			{
				onlyForUser: true,
				status: params.status ?? ["unread", "read"],
				search: params.search || undefined,
			},
			{
				getNextPageParam: (lastPage) => lastPage.meta.cursor,
			},
		),
	);

	const items = useMemo(() => {
		if (!data) return [];

		const list = data.pages.flatMap((page) => page.data);

		return list;
	}, [data]);

	useEffect(() => {
		// update selection
		for (const item of items) {
			if (selectedIds.has(item.id)) {
				// keep selected
			} else {
				// add the item as unselected
				toggleSelection(item.id, false);
			}
		}
	}, [items]);

	return (
		<div>
			{items.map((activity) => {
				const props = getNotificationItemProps(activity);
				if (!props) return null;
				if (props.title === "undefined") return null;
				return (
					<div key={activity.id} className="border-b last:border-0">
						<NotificationItem {...props} />
					</div>
				);
			})}
			{hasNextPage && (
				<div className="flex justify-center py-8">
					<Button
						variant={"outline"}
						onClick={() => fetchNextPage()}
						disabled={isLoading}
					>
						Load more
					</Button>
				</div>
			)}
		</div>
	);
};

export const getNotificationItemProps = ({
	type,
	metadata,
	...activity
}: RouterOutputs["activities"]["get"]["data"][number]): NotificationItemProps | null => {
	if (!metadata) return null;

	const commonProps = {
		createdAt: new Date(activity.createdAt!),
		status: activity.status,
		id: activity.id,
	};

	switch (type) {
		case "task_created":
			return {
				title: `${metadata.title}`,
				description: "A new task has been created.",
				icon: LayersIcon,
				href: `/dashboard/workstation/${activity.groupId}`,
				...commonProps,
			};
		case "task_completed":
			return {
				title: `${metadata.title}`,
				description: "A task has been completed.",
				icon: CircleCheckIcon,
				href: `/dashboard/workstation/${activity.groupId}`,
				...commonProps,
			};
		case "task_updated":
			return {
				title: `${metadata.title}`,
				description: "A task has been updated.",
				icon: SquarePenIcon,
				href: `/dashboard/workstation/${activity.groupId}`,
				...commonProps,
			};
		case "task_assigned":
			return {
				title: `${metadata.title}`,
				description: "You have been assigned to this task.",
				icon: CirclePlusIcon,
				href: `/dashboard/workstation/${activity.groupId}`,
				...commonProps,
			};
		case "checklist_item_created":
			return {
				title: `${metadata.title}`,
				description: "Checklist item added",
				icon: SquarePlusIcon,
				href: `/dashboard/workstation/${activity.groupId}`,
				...commonProps,
			};
		case "task_column_changed":
			return {
				title: `${metadata.title}`,
				description: `Task moved to ${metadata.toColumnName}`,
				icon: CircleDashedIcon,
				href: `/dashboard/workstation/${activity.groupId}`,
				...commonProps,
			};
		case "checklist_item_completed":
			return {
				title: `${metadata.title}`,
				description: "Checklist item completed",
				icon: SquareCheckIcon,
				href: `/dashboard/workstation/${activity.groupId}`,
				...commonProps,
			};
		case "mention":
			return {
				title: `You were mentioned in ${metadata.contextType}`,
				description: `${metadata.contextSnippet}`,
				...commonProps,
			};
		default:
			return null;
	}
};
