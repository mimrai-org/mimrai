import type { RouterOutputs } from "@mimir/api/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
	ArrowUpNarrowWideIcon,
	FlagIcon,
	TrashIcon,
	UserIcon,
} from "lucide-react";
import { queryClient, trpc } from "@/utils/trpc";
import { Checkbox } from "../ui/checkbox";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
	ContextMenuTrigger,
} from "../ui/context-menu";
import { LabelBadge } from "../ui/label-badge";
import { Assignee } from "./asignee";
import { PriorityBadge } from "./priority";

export const TaskContextMenu = ({
	task,
	children,
}: {
	task: RouterOutputs["tasks"]["get"]["data"][number];
	children: React.ReactNode;
}) => {
	const { mutateAsync: deleteTask } = useMutation(
		trpc.tasks.delete.mutationOptions(),
	);
	const { mutate: updateTask } = useMutation(
		trpc.tasks.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(trpc.tasks.get.queryOptions());
				queryClient.invalidateQueries(trpc.tasks.get.infiniteQueryOptions());
			},
		}),
	);

	const { data: members } = useQuery(
		trpc.teams.getMembers.queryOptions(undefined, {
			refetchOnMount: false,
		}),
	);
	const { data: columns } = useQuery(
		trpc.columns.get.queryOptions(
			{},
			{
				refetchOnMount: false,
			},
		),
	);
	const { data: labels } = useQuery(
		trpc.labels.get.queryOptions(
			{},
			{
				refetchOnMount: false,
			},
		),
	);

	const handleDeleteTask = async (taskId: string) => {
		await deleteTask({ id: taskId });
		queryClient.invalidateQueries(trpc.tasks.get.queryOptions());
		queryClient.invalidateQueries(trpc.tasks.get.infiniteQueryOptions());
	};

	const handleUpdateTask = async (data: {
		priority?: "low" | "medium" | "high";
		labels?: string[];
		assigneeId?: string;
		columnId?: string;
	}) => {
		updateTask({ id: task.id, ...data });
	};

	return (
		<ContextMenu key={task.id}>
			<ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
			<ContextMenuContent className="w-56">
				{/* <ContextMenuLabel>
					<div className="line-clamp-1">{task.title}</div>
				</ContextMenuLabel> */}
				<ContextMenuSub>
					<ContextMenuSubTrigger className="flex items-center gap-2">
						Move to
					</ContextMenuSubTrigger>
					<ContextMenuSubContent className="w-32">
						{columns?.data
							?.filter((column) => column.id !== task.columnId)
							.map((column) => (
								<ContextMenuItem
									key={column.id}
									onClick={handleUpdateTask.bind(null, {
										columnId: column.id,
									})}
								>
									{column.type === "done" && <FlagIcon />}
									{column.name}
								</ContextMenuItem>
							))}
					</ContextMenuSubContent>
				</ContextMenuSub>

				<ContextMenuSeparator />
				<ContextMenuSub>
					<ContextMenuSubTrigger className="flex items-center gap-2">
						Labels
					</ContextMenuSubTrigger>
					<ContextMenuSubContent className="w-52">
						{labels?.map((label) => {
							const isAssigned = task.labels?.some((l) => l.id === label.id);
							return (
								<ContextMenuItem
									key={label.id}
									onClick={() => {
										if (isAssigned) {
											handleUpdateTask({
												labels: task.labels
													?.filter((l) => l.id !== label.id)
													.map((l) => l.id),
											});
										} else {
											handleUpdateTask({
												labels: [
													...(task.labels?.map((l) => l.id) || []),
													label.id,
												],
											});
										}
									}}
								>
									<Checkbox checked={isAssigned} className="mr-2" />
									<LabelBadge {...label} />
								</ContextMenuItem>
							);
						})}
					</ContextMenuSubContent>
				</ContextMenuSub>
				<ContextMenuSub>
					<ContextMenuSubTrigger className="flex items-center gap-2">
						Priority
					</ContextMenuSubTrigger>
					<ContextMenuSubContent className="w-32">
						{["low", "medium", "high"].map((level) => (
							<ContextMenuItem
								key={level}
								onClick={handleUpdateTask.bind(null, {
									priority: level as any,
								})}
							>
								<PriorityBadge value={level as any} />
							</ContextMenuItem>
						))}
					</ContextMenuSubContent>
				</ContextMenuSub>
				<ContextMenuSub>
					<ContextMenuSubTrigger className="flex items-center gap-2">
						Assign to
					</ContextMenuSubTrigger>
					<ContextMenuSubContent className="w-48">
						{members?.map((member) => (
							<ContextMenuItem
								key={member.id}
								onClick={handleUpdateTask.bind(null, { assigneeId: member.id })}
							>
								<Assignee {...member} />
							</ContextMenuItem>
						))}
					</ContextMenuSubContent>
				</ContextMenuSub>
				<ContextMenuItem
					variant="destructive"
					onClick={handleDeleteTask.bind(null, task.id)}
				>
					Eliminar
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
};
