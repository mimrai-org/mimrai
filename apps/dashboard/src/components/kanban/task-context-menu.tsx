import type { RouterOutputs } from "@mimir/server/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowUpNarrowWideIcon, TrashIcon, UserIcon } from "lucide-react";
import { queryClient, trpc } from "@/utils/trpc";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuLabel,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
	ContextMenuTrigger,
} from "../ui/context-menu";
import { Assignee } from "./asignee";
import { Priority, PriorityBadge } from "./priority";

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
	const { mutateAsync: updateTask } = useMutation(
		trpc.tasks.update.mutationOptions(),
	);

	const { data } = useQuery(trpc.teams.getMembers.queryOptions());

	const handleDeleteTask = async (taskId: string) => {
		await deleteTask({ id: taskId });
		queryClient.invalidateQueries(trpc.tasks.get.queryOptions());
	};

	const handleUpdateTask = async (data: {
		priority?: "low" | "medium" | "high";
		assigneeId?: string;
	}) => {
		await updateTask({ id: task.id, ...data });
		queryClient.invalidateQueries(trpc.tasks.get.queryOptions());
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
						<ArrowUpNarrowWideIcon />
						Set Priority
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
						<UserIcon />
						Assign to
					</ContextMenuSubTrigger>
					<ContextMenuSubContent className="w-48">
						{data?.map((member) => (
							<ContextMenuItem
								key={member.id}
								onClick={handleUpdateTask.bind(null, { assigneeId: member.id })}
							>
								<Assignee name={member.name} email={member.email} />
							</ContextMenuItem>
						))}
					</ContextMenuSubContent>
				</ContextMenuSub>
				<ContextMenuItem
					variant="destructive"
					onClick={handleDeleteTask.bind(null, task.id)}
				>
					<TrashIcon />
					Eliminar
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
};
