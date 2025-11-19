import type { RouterOutputs } from "@mimir/api/trpc";
import { Checkbox } from "@mimir/ui/checkbox";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
	ContextMenuTrigger,
} from "@mimir/ui/context-menu";
import { LabelBadge } from "@mimir/ui/label-badge";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTaskParams } from "@/hooks/use-task-params";
import { queryClient, trpc } from "@/utils/trpc";
import { ColumnIcon } from "../column-icon";
import Loader from "../loader";
import { ProjectIcon } from "../project-icon";
import { Assignee, AssigneeAvatar } from "./asignee-avatar";
import { PriorityItem } from "./priority";

export const TaskContextMenu = ({
	task,
	children,
	showDelete = true,
	additionalItems,
}: {
	task: RouterOutputs["tasks"]["get"]["data"][number];
	children: React.ReactNode;
	showDelete?: boolean;
	additionalItems?: React.ReactNode;
}) => {
	const { setParams } = useTaskParams();

	const { mutateAsync: deleteTask } = useMutation(
		trpc.tasks.delete.mutationOptions({
			onMutate: () => {
				toast.loading("Deleting task...", {
					id: "delete-task",
				});
			},
			onSuccess: () => {
				toast.success("Task deleted", {
					id: "delete-task",
				});
				queryClient.invalidateQueries(trpc.tasks.get.queryOptions());
				queryClient.invalidateQueries(trpc.tasks.get.infiniteQueryOptions());
			},
			onError: () => {
				toast.error("Failed to delete task", {
					id: "delete-task",
				});
			},
		}),
	);
	const { mutate: updateTask } = useMutation(
		trpc.tasks.update.mutationOptions({
			onMutate: () => {
				toast.loading("Updating task...", {
					id: "update-task",
				});
			},
			onSuccess: () => {
				toast.success("Task updated", {
					id: "update-task",
				});
				queryClient.invalidateQueries(trpc.tasks.get.queryOptions());
				queryClient.invalidateQueries(trpc.tasks.get.infiniteQueryOptions());
			},
			onError: () => {
				toast.error("Failed to update task", {
					id: "update-task",
				});
			},
		}),
	);

	const { mutate: cloneTask, isPending: isCloning } = useMutation(
		trpc.tasks.clone.mutationOptions({
			onMutate: () => {
				toast.loading("Cloning task...", {
					id: "clone-task",
				});
			},
			onSuccess: (task) => {
				toast.success("Task cloned", {
					id: "clone-task",
				});
				queryClient.invalidateQueries(trpc.tasks.get.infiniteQueryOptions());
				queryClient.invalidateQueries(trpc.tasks.get.queryOptions());
				setParams({ taskId: task.id });
			},
			onError: () => {
				toast.error("Failed to clone task", {
					id: "clone-task",
				});
			},
		}),
	);

	const { data: members } = useQuery(
		trpc.teams.getMembers.queryOptions(undefined, {
			refetchOnMount: false,
			refetchOnWindowFocus: false,
		}),
	);
	const { data: columns } = useQuery(
		trpc.columns.get.queryOptions(
			{},
			{
				refetchOnMount: false,
				refetchOnWindowFocus: false,
			},
		),
	);
	const { data: labels } = useQuery(
		trpc.labels.get.queryOptions(
			{},
			{
				refetchOnMount: false,
				refetchOnWindowFocus: false,
			},
		),
	);

	const { data: projects } = useQuery(
		trpc.projects.get.queryOptions(
			{},
			{
				refetchOnMount: false,
				refetchOnWindowFocus: false,
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
		projectId?: string;
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
					<ContextMenuSubContent className="w-48">
						{columns?.data
							?.filter((column) => column.id !== task.columnId)
							.map((column) => (
								<ContextMenuItem
									key={column.id}
									onClick={handleUpdateTask.bind(null, {
										columnId: column.id,
									})}
								>
									<ColumnIcon type={column.type} className="size-4" />
									{column.name}
								</ContextMenuItem>
							))}
					</ContextMenuSubContent>
				</ContextMenuSub>

				<ContextMenuItem
					onClick={() => cloneTask({ taskId: task.id })}
					disabled={isCloning}
				>
					{isCloning && <Loader />}
					Clone
				</ContextMenuItem>

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
						{["low", "medium", "high", "urgent"].map((level) => (
							<ContextMenuItem
								key={level}
								onClick={handleUpdateTask.bind(null, {
									priority: level as any,
								})}
							>
								<PriorityItem value={level as any} />
							</ContextMenuItem>
						))}
					</ContextMenuSubContent>
				</ContextMenuSub>
				<ContextMenuSub>
					<ContextMenuSubTrigger className="flex items-center gap-2">
						Project
					</ContextMenuSubTrigger>
					<ContextMenuSubContent className="w-32">
						{projects?.data.map((project) => (
							<ContextMenuItem
								key={project.id}
								onClick={handleUpdateTask.bind(null, {
									projectId: project.id,
								})}
							>
								<ProjectIcon {...project} />
								{project.name}
							</ContextMenuItem>
						))}
					</ContextMenuSubContent>
				</ContextMenuSub>
				<ContextMenuSub>
					<ContextMenuSubTrigger className="flex items-center gap-2">
						Assign to
					</ContextMenuSubTrigger>
					<ContextMenuSubContent className="w-48">
						<ContextMenuItem
							onClick={handleUpdateTask.bind(null, { assigneeId: null })}
						>
							<div className="flex items-center gap-2">
								<AssigneeAvatar />
								Unassigned
							</div>
						</ContextMenuItem>
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
				{additionalItems}
				{showDelete && (
					<ContextMenuItem
						variant="destructive"
						onClick={handleDeleteTask.bind(null, task.id)}
					>
						Delete
					</ContextMenuItem>
				)}
			</ContextMenuContent>
		</ContextMenu>
	);
};
