import { useChannelName, useRealtime } from "@/lib/realtime-client";
import { queryClient, trpc } from "@/utils/trpc";
import type { Task } from "./use-data";
import { addTaskToCache, updateTaskInCache } from "./use-data-cache-helpers";

export const useActivitiesRealtime = () => {
	const channels = useChannelName();

	useRealtime({
		channels: channels,
		events: ["activities.created"],

		onData: async (event) => {
			if (event.data.type === "task_created") {
				// Fetch the task details and update the cache
				const task = await queryClient.fetchQuery(
					trpc.tasks.getById.queryOptions({
						id: event.data.groupId,
					}),
				);
				if (task) {
					addTaskToCache(task);
				}
				return;
			}

			const payload: Partial<Task> = {
				id: event.data.groupId,
			};

			if (event.data.type === "task_column_changed") {
				// Update the get task by id query
				payload.statusId = event.data.metadata.toColumnId as string;
			}

			if (event.data.type === "task_assigned") {
				payload.assigneeId = event.data.metadata.assigneeId as string;
			}

			updateTaskInCache(payload);

			if (
				[
					"checklist_item_completed",
					"checklist_item_created",
					"checklist_item_updated",
				].includes(event.data.type)
			) {
				queryClient.invalidateQueries(
					trpc.checklists.get.queryOptions({ taskId: event.data.groupId }),
				);
			}

			// Fetch activity
			const newActivity = await queryClient.fetchQuery(
				trpc.activities.get.queryOptions({
					ids: [event.data.id],
				}),
			);
			if (!newActivity.data.length) return;
			const [activity] = newActivity.data;

			// Update activities list
			queryClient.setQueryData(
				trpc.activities.get.infiniteQueryKey({
					groupId: event.data.groupId,
					nStatus: ["archived"],
					pageSize: 10,
				}),
				(oldData) => {
					if (!oldData) return oldData;
					// Check if the activity already exists
					if (
						oldData.pages.some((page) =>
							page.data.some((a) => a.id === activity.id),
						)
					) {
						return oldData;
					}

					return {
						...oldData,
						pages: [
							{
								data: [activity, ...oldData.pages[0].data],
								meta: oldData.pages[0].meta,
							},
							...oldData.pages.slice(1),
						],
					};
				},
			);
		},
	});
};
