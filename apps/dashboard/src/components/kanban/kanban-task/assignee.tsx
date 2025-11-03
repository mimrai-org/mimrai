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
import { queryClient, trpc } from "@/utils/trpc";
import { Assignee, AssigneeAvatar } from "../asignee";
import type { KanbanTask } from "./kanban-task";

export const KanbanAssignee = ({ task }: { task: KanbanTask }) => {
	const { data, isLoading } = useQuery(trpc.teams.getMembers.queryOptions());

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
					<AssigneeAvatar {...task.assignee} />
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
