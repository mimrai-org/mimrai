"use client";

import type { RouterOutputs } from "@api/trpc/routers";
import { Button } from "@mimir/ui/button";
import { LabelBadge } from "@mimir/ui/label-badge";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Loader2Icon, PlusIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo } from "react";
import {
	EmptyState,
	EmptyStateAction,
	EmptyStateDescription,
	EmptyStateIcon,
	EmptyStateTitle,
} from "@/components/empty-state";
import { AssigneeAvatar } from "@/components/kanban/asignee-avatar";
import { TaskContextMenu } from "@/components/kanban/task-context-menu";
import { TasksFilters } from "@/components/kanban/tasks-filters";
import { TaskItem } from "@/components/task-item";
import { useTaskParams } from "@/hooks/use-task-params";
import { useTasksFilterParams } from "@/hooks/use-tasks-filter-params";
import { queryClient, trpc } from "@/utils/trpc";

export const BacklogList = () => {
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
				projectId: filters.taskProjectId ?? undefined,
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
			<EmptyState>
				<EmptyStateIcon />
				<EmptyStateTitle>Empty Backlog</EmptyStateTitle>
				<EmptyStateDescription>
					Your backlog is emptier than a store in Cuba. Create tasks to see them
					listed here.
				</EmptyStateDescription>
				<EmptyStateAction>
					<Button
						variant="default"
						onClick={() =>
							setParams({ createTask: true, taskColumnId: backlogColumnId })
						}
					>
						<PlusIcon />
						Create a task
					</Button>
				</EmptyStateAction>
			</EmptyState>
		);
	}

	return (
		<div className="">
			<div className="flex justify-between">
				<div>
					<TasksFilters />
				</div>
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
