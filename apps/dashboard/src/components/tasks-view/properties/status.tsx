"use client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Command, CommandItem } from "@ui/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@ui/components/ui/popover";
import { StatusIcon } from "@/components/status-icon";
import { queryClient, trpc } from "@/utils/trpc";
import type { Task } from "./task-properties";

export const TaskPropertyStatus = (task: Pick<Task, "status" | "id">) => {
	const enabled = Boolean(task.status);

	// const { data } = useQuery(
	// 	trpc.statuses.get.queryOptions(
	// 		{},
	// 		{
	// 			enabled,
	// 			refetchOnWindowFocus: false,
	// 			refetchOnMount: false,
	// 		},
	// 	),
	// );

	// const { mutate: updateStatus } = useMutation(
	// 	trpc.tasks.update.mutationOptions({
	// 		onSettled: () => {
	// 			queryClient.invalidateQueries(trpc.tasks.get.infiniteQueryOptions());
	// 		},
	// 	}),
	// );

	if (!enabled) return null;

	return (
		// <Popover>
		// 	<PopoverTrigger asChild>
		<div>
			<time className="flex h-5.5 items-center rounded-sm text-xs">
				<StatusIcon {...task.status} className="size-3.5" />
				<span className="sr-only">{task.status.name}</span>
			</time>
		</div>
		// 	</PopoverTrigger>
		// 	<PopoverContent>
		// 		<Command>
		// 			{data?.data.map((status) => (
		// 				<CommandItem
		// 					key={status.id}
		// 					onSelect={() => {
		// 						updateStatus({
		// 							id: task.id,
		// 							statusId: status.id,
		// 						});
		// 					}}
		// 				>
		// 					<StatusIcon {...status} className="size-3.5" />
		// 					{status.name}
		// 				</CommandItem>
		// 			))}
		// 		</Command>
		// 	</PopoverContent>
		// </Popover>
	);
};
