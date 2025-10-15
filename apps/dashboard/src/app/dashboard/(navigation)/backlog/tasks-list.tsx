"use client";

import type { RouterOutputs } from "@api/trpc/routers";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { formatRelative } from "date-fns";
import { Loader2Icon, PlusIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo } from "react";
import { KanbanTask } from "@/components/kanban/kanban-task";
import { Priority } from "@/components/kanban/priority";
import { TaskContextMenu } from "@/components/kanban/task-context-menu";
import { TasksFilters } from "@/components/kanban/tasks-filters";
import { Button } from "@/components/ui/button";
import { LabelBadge } from "@/components/ui/label-badge";
import { useTaskParams } from "@/hooks/use-task-params";
import { useTasksFilterParams } from "@/hooks/use-tasks-filter-params";
import { queryClient, trpc } from "@/utils/trpc";

export const TasksList = () => {
	const { setParams } = useTaskParams();
	const { setParams: setFilters, ...filters } = useTasksFilterParams();
	const { data: backlogColumn } = useQuery(
		trpc.columns.getBacklogColumn.queryOptions(),
	);
	const backlogColumnId = backlogColumn?.id;

	const {
		data: tasks,
		fetchNextPage,
		isLoading,
		hasNextPage,
	} = useInfiniteQuery(
		trpc.tasks.get.infiniteQueryOptions(
			{
				assigneeId: filters.assigneeId ?? undefined,
				search: filters.search ?? undefined,
				labels: filters.labels ?? undefined,
				columnId: backlogColumnId ? [backlogColumnId] : ["none"],
				pageSize: 20,
			},
			{
				getNextPageParam: (lastPage) => lastPage.meta.cursor,
			},
		),
	);

	const listData = useMemo(() => {
		return tasks?.pages.flatMap((page) => page.data) || [];
	}, [tasks]);

	return (
		<div className="px-8 py-4">
			<div className="flex justify-between">
				<div>
					<TasksFilters />
				</div>
				<Button
					variant="default"
					onClick={() =>
						setParams({ createTask: true, taskColumnId: backlogColumnId })
					}
				>
					<PlusIcon />
					Add Task
				</Button>
			</div>
			<AnimatePresence>
				<ul className="grid gap-4 py-4 md:grid-cols-2 lg:grid-cols-4">
					{listData.map((task) => (
						<TaskContextMenu key={task.id} task={task}>
							<li>
								<KanbanTask task={task} />
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
						{isLoading && <Loader2Icon className="animate-spin" />}
						Load more
					</Button>
				</div>
			)}
		</div>
	);
};

export const TaskItem = ({
	task,
}: {
	task: RouterOutputs["tasks"]["get"]["data"][number];
}) => {
	const { setParams } = useTaskParams();

	return (
		<motion.button
			type="button"
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: 10 }}
			className="flex w-full flex-col gap-2 border p-4 transition-colors hover:bg-accent/50"
			onClick={() => {
				queryClient.setQueryData(
					trpc.tasks.getById.queryKey({ id: task.id }),
					task,
				);
				setParams({ taskId: task.id });
			}}
		>
			<div className="flex items-center justify-between text-sm">
				<div className="flex items-center gap-2">
					<h3 className="font-medium">{task.title}</h3>
				</div>
				<span className="text-muted-foreground text-xs">
					{task.dueDate
						? formatRelative(new Date(task.dueDate!), new Date())
						: "No due date"}
				</span>
			</div>
			<div className="flex items-center justify-between">
				<div className="flex gap-2">
					{task.labels?.map((label) => (
						<LabelBadge key={label.id} {...label} />
					))}
				</div>
				<Priority value={task.priority} />
			</div>
		</motion.button>
	);
};
