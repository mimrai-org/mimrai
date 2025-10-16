"use client";

import type { RouterOutputs } from "@api/trpc/routers";
import { filter } from "@mdxeditor/editor";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { task } from "better-auth/react";
import { formatRelative } from "date-fns";
import {
	BrushCleaningIcon,
	Loader2Icon,
	PlusIcon,
	SquareDashedIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo } from "react";
import { AssigneeAvatar } from "@/components/kanban/asignee";
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
	const {
		setParams: setFilters,
		hasParams: hasFilters,
		...filters
	} = useTasksFilterParams();
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

	if (listData.length === 0 && !isLoading && !hasFilters) {
		return (
			<div className="mt-12 flex flex-col items-start justify-center gap-2 px-8 text-center">
				<h3 className="flex items-center gap-2 text-2xl text-muted-foreground">
					You have no tasks in your backlog
				</h3>
				<p className="max-w-md text-balance text-muted-foreground text-sm">
					Backlog is empty. Create tasks to see them listed here.
				</p>
				<Button
					variant="default"
					className="mt-4"
					onClick={() =>
						setParams({ createTask: true, taskColumnId: backlogColumnId })
					}
				>
					<PlusIcon />
					Create your first task
				</Button>
			</div>
		);
	}

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
				<ul className="flex flex-col py-4">
					{listData.map((task) => (
						<TaskContextMenu key={task.id} task={task}>
							<li>
								<TaskItem task={task} />
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
			layout
			layoutId={`task-${task.id}`}
			className="flex w-full flex-row justify-between gap-2 border-b p-4 transition-colors hover:bg-accent/50"
			onClick={() => {
				queryClient.setQueryData(
					trpc.tasks.getById.queryKey({ id: task.id }),
					task,
				);
				setParams({ taskId: task.id });
			}}
		>
			<div className="flex items-center gap-2 text-start text-sm">
				{task.sequence && (
					<span className="text-muted-foreground">{task.sequence}</span>
				)}
				<h3 className="font-medium">{task.title}</h3>
			</div>
			<div className="flex items-center gap-4">
				<div className="flex gap-2">
					{task.labels?.map((label) => (
						<LabelBadge key={label.id} {...label} />
					))}
				</div>
				<AssigneeAvatar {...task.assignee} />
			</div>
		</motion.button>
	);
};
