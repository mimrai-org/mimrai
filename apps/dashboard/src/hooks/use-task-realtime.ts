import { useChannelName, useRealtime } from "@/lib/realtime-client";
import { queryClient, trpc } from "@/utils/trpc";

export const useTaskRealtime = (taskId?: string) => {
	const channels = useChannelName(taskId, [
		"task_comment",
		"task_update",
		"task_comment_reply",
		"task_assigned",
		"task_column_changed",
		"task_completed",
		"checklist_item_completed",
		"checklist_item_created",
		"checklist_item_updated",
	]);

	useRealtime({
		channels,
		events: ["activities.created"],
		enabled: Boolean(taskId),
		onData: async (event) => {
			// Fetch activity
			const newActivity = await queryClient.fetchQuery(
				trpc.activities.get.queryOptions({
					ids: [event.data.id],
				}),
			);
			if (!newActivity.data.length) return;
			const [activity] = newActivity.data;

			// Update the get task by id query
			if (["task_column_changed", "task_assigned"].includes(activity.type)) {
				queryClient.invalidateQueries(
					trpc.tasks.getById.queryOptions({ id: taskId! }),
				);
			}

			if (
				[
					"checklist_item_completed",
					"checklist_item_created",
					"checklist_item_updated",
				].includes(activity.type)
			) {
				queryClient.invalidateQueries(
					trpc.checklists.get.queryOptions({ taskId: taskId! }),
				);
			}

			// Update activities list
			queryClient.setQueryData(
				trpc.activities.get.infiniteQueryKey({
					groupId: taskId,
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
