import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandSeparator,
} from "@ui/components/ui/command";
import { ContextMenuItem } from "@ui/components/ui/context-menu";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@ui/components/ui/popover";
import { PlusIcon, XIcon } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useDebounceValue } from "usehooks-ts";
import Loader from "@/components/loader";
import { TaskContextMenu } from "@/components/task-context-menu";
import { TaskItem } from "@/components/tasks-view/task-item";
import { useTaskParams } from "@/hooks/use-task-params";
import { queryClient, trpc } from "@/utils/trpc";

export const TasksList = ({ projectId }: { projectId: string }) => {
	const { data, isLoading, hasNextPage, fetchNextPage } = useInfiniteQuery(
		trpc.tasks.get.infiniteQueryOptions(
			{
				pageSize: 20,
				projectId: [projectId],
			},
			{
				getNextPageParam: (lastPage) => lastPage.meta.cursor,
			},
		),
	);

	const { mutate: updateTask, isPending: isUpdating } = useMutation(
		trpc.tasks.update.mutationOptions({
			onMutate: () => {
				toast.loading("Removing task...", { id: "remove-task" });
			},
			onError: (error) => {
				toast.error("Failed to remove task", { id: "remove-task" });
			},
			onSuccess: (task) => {
				toast.success("Task removed successfully", { id: "remove-task" });
				queryClient.invalidateQueries(trpc.tasks.get.queryOptions());
				queryClient.invalidateQueries(trpc.projects.get.infiniteQueryOptions());
				queryClient.invalidateQueries(trpc.tasks.get.infiniteQueryOptions());
			},
		}),
	);

	const listData = useMemo(() => {
		return data?.pages.flatMap((page) => page.data) || [];
	}, [data]);

	return (
		<div>
			<div className="flex items-center justify-between">
				<div className="font-medium text-sm">Tasks</div>
				<AddTaskButton projectId={projectId} />
			</div>
			<AnimatePresence>
				<ul className="flex flex-col gap-2 py-2">
					{listData.map((task) => (
						<TaskContextMenu
							key={task.id}
							task={task}
							showDelete={false}
							additionalItems={
								<ContextMenuItem
									variant="destructive"
									disabled={isUpdating}
									onClick={() => {
										updateTask({
											id: task.id,
											projectId: null,
										});
									}}
								>
									<XIcon />
									Remove from project
								</ContextMenuItem>
							}
						>
							<li>
								<TaskItem
									task={task}
									className="bg-accent hover:bg-accent/80"
								/>
							</li>
						</TaskContextMenu>
					))}
				</ul>
			</AnimatePresence>
			{hasNextPage && (
				<div className="flex justify-center">
					<Button
						variant="outline"
						onClick={() => fetchNextPage()}
						disabled={!hasNextPage || isLoading}
					>
						{isLoading && <Loader />}
						Load more
					</Button>
				</div>
			)}
		</div>
	);
};

const AddTaskButton = ({ projectId }: { projectId: string }) => {
	const [search, setSearch] = useState("");
	const [debouncedSearch] = useDebounceValue(search, 400);
	const { setParams } = useTaskParams();

	const { data, isLoading } = useQuery(
		trpc.tasks.get.queryOptions({
			search: debouncedSearch,
			nProjectId: [projectId],
			pageSize: 10,
		}),
	);

	const { mutate: updateTask, isPending: isUpdating } = useMutation(
		trpc.tasks.update.mutationOptions({
			onMutate: () => {
				toast.loading("Adding task...", { id: "add-task" });
			},
			onError: (error) => {
				toast.error("Failed to add task", { id: "add-task" });
			},
			onSuccess: (task) => {
				toast.success("Task added successfully", { id: "add-task" });
				queryClient.invalidateQueries(trpc.projects.get.infiniteQueryOptions());
				queryClient.invalidateQueries(trpc.tasks.get.queryOptions());
				queryClient.invalidateQueries(trpc.tasks.get.infiniteQueryOptions());
			},
		}),
	);

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant={"ghost"} size={"sm"}>
					<PlusIcon />
				</Button>
			</PopoverTrigger>
			<PopoverContent>
				<Command shouldFilter={false}>
					<CommandInput
						value={search}
						onValueChange={(v) => setSearch(v)}
						placeholder="Search tasks..."
					/>
					{isLoading && <Loader />}
					<CommandGroup heading="Tasks">
						{data?.data.map((task) => (
							<CommandItem
								key={task.id}
								className="text-sm"
								disabled={isUpdating}
								onSelect={() => {
									updateTask({
										id: task.id,
										projectId,
									});
								}}
							>
								<span>{task.sequence}</span>
								<span className="ml-1 truncate font-medium">{task.title}</span>
							</CommandItem>
						))}
						<CommandSeparator className="my-2" />
						<CommandItem
							onSelect={() =>
								setParams({ createTask: true, taskProjectId: projectId })
							}
						>
							<PlusIcon />
							Create new task
						</CommandItem>
					</CommandGroup>
					<CommandEmpty>No tasks found.</CommandEmpty>
				</Command>
			</PopoverContent>
		</Popover>
	);
};
