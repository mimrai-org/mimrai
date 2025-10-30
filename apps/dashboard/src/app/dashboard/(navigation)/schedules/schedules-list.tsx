"use client";

import type { RouterOutputs } from "@api/trpc/routers";
import { Button } from "@mimir/ui/button";
import { LabelBadge } from "@mimir/ui/label-badge";
import { useInfiniteQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2Icon, PlusIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo } from "react";
import { AssigneeAvatar } from "@/components/kanban/asignee";
import { TaskContextMenu } from "@/components/kanban/task-context-menu";
import { useTaskParams } from "@/hooks/use-task-params";
import { useTasksFilterParams } from "@/hooks/use-tasks-filter-params";
import { queryClient, trpc } from "@/utils/trpc";

export const SchedulesList = () => {
	const { setParams } = useTaskParams();
	const {
		setParams: setFilters,
		hasParams: hasFilters,
		...filters
	} = useTasksFilterParams();
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
				pageSize: 20,
				recurring: true,
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
				<h3 className="flex items-center gap-2 font-runic text-3xl uppercase">
					no tasks scheduled
				</h3>
				<p className="max-w-lg text-balance text-start text-muted-foreground text-sm">
					Schedule tasks to repeat at regular intervals to stay on top of your
					work.
				</p>
				<Button
					variant="default"
					className="mt-4"
					onClick={() => setParams({ createTask: true })}
				>
					<PlusIcon />
					Create a task
				</Button>
			</div>
		);
	}

	return (
		<div className="px-8 py-4">
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
				{task.sequence !== null && (
					<span className="font-mono text-muted-foreground">
						{task.sequence}
					</span>
				)}
				<h3 className="font-medium">{task.title}</h3>
			</div>
			<div className="flex items-center gap-2">
				<div className="flex gap-2">
					{task.labels?.map((label) => (
						<LabelBadge key={label.id} {...label} />
					))}
				</div>
				{task.recurringNextDate && (
					<div className="flex h-5.5 items-center gap-2 bg-secondary/80 px-2 text-xs">
						<span className="text-muted-foreground">Next</span>
						<span>
							{format(new Date(task.recurringNextDate), "MMM dd, yyyy")}
						</span>
					</div>
				)}
			</div>
		</motion.button>
	);
};
