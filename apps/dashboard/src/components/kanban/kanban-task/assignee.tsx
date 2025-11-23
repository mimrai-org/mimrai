import { PopoverClose } from "@radix-ui/react-popover";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
	Command,
	CommandGroup,
	CommandInput,
	CommandItem,
} from "@ui/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@ui/components/ui/popover";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { queryClient, trpc } from "@/utils/trpc";
import { Assignee, AssigneeAvatar } from "../asignee-avatar";
import type { KanbanTask } from "./kanban-task";

export const KanbanAssignee = ({ task }: { task: KanbanTask }) => {
	const { data, isLoading } = useQuery(trpc.teams.getMembers.queryOptions());

	const coworkers = useMemo(() => {
		const coworksersIds: string[] = [task.assigneeId].filter(
			Boolean,
		) as string[];
		const checklistAssigneeIds =
			task.checklistSummary?.checklist?.map((item) => item.assigneeId) ?? [];

		return Array.from(
			new Set(
				[...coworksersIds, ...checklistAssigneeIds]
					.flatMap(
						(item) =>
							(item ? data?.find((member) => member.id === item) : null)!,
					)
					.filter(Boolean),
			),
		).reverse();
	}, [task.checklistSummary, data, task.assigneeId]);

	const { mutate: updateTask, isPending } = useMutation(
		trpc.tasks.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(trpc.tasks.get.queryOptions());
				queryClient.invalidateQueries(trpc.tasks.get.infiniteQueryOptions());
			},
		}),
	);

	return (
		<div
			onClick={(e) => {
				e.stopPropagation();
			}}
		>
			<Popover>
				<PopoverTrigger>
					<div className="flex items-center">
						{coworkers.length > 0 ? (
							<div className="flex flex-row-reverse items-center">
								{coworkers.map((coworker, index) => (
									<div
										key={coworker.id}
										className={cn("", {
											"-ml-4 brightness-80": index !== coworkers.length - 1,
										})}
									>
										<AssigneeAvatar {...coworker} />
									</div>
								))}
							</div>
						) : (
							<AssigneeAvatar />
						)}
					</div>
				</PopoverTrigger>
				<PopoverContent>
					<Command>
						<CommandInput placeholder="Search..." />
						<CommandGroup>
							<PopoverClose className="w-full">
								<CommandItem
									onSelect={() => {
										updateTask({
											id: task.id,
											assigneeId: null,
										});
									}}
								>
									<div className="flex items-center gap-2">
										<AssigneeAvatar />
										Unassigned
									</div>
								</CommandItem>
							</PopoverClose>
							{data?.map((member) => (
								<PopoverClose key={member.id} className="w-full">
									<CommandItem
										onSelect={() => {
											updateTask({
												id: task.id,
												assigneeId: member.id,
											});
										}}
									>
										<Assignee {...member} />
									</CommandItem>
								</PopoverClose>
							))}
						</CommandGroup>
					</Command>
				</PopoverContent>
			</Popover>
		</div>
	);
};
