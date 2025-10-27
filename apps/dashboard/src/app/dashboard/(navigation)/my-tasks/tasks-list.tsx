"use client";

import type { RouterOutputs } from "@api/trpc/routers";
import { Button } from "@mimir/ui/button";
import { LabelBadge } from "@mimir/ui/label-badge";
import { useQuery } from "@tanstack/react-query";
import { formatRelative } from "date-fns";
import { ArrowDownIcon, ArrowRightIcon, CheckIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo } from "react";
import { Priority } from "@/components/kanban/priority";
import { TaskContextMenu } from "@/components/kanban/task-context-menu";
import { useTaskParams } from "@/hooks/use-task-params";
import { useUser } from "@/hooks/use-user";
import { queryClient, trpc } from "@/utils/trpc";

export const TasksList = () => {
	const user = useUser();
	const { data: columns } = useQuery(trpc.columns.get.queryOptions());

	const { data: tasks, isLoading } = useQuery(
		trpc.tasks.get.queryOptions({
			assigneeId: user?.id ? [user?.id] : [],
			view: "board",
		}),
	);

	const groupedTasks = useMemo(() => {
		if (!tasks?.data || !columns) return [];
		const grouped = columns?.data.map((column) => ({
			...column,
			tasks: tasks?.data.filter((task) => task.columnId === column.id) || [],
		}));

		return grouped.filter((group) => group.tasks.length > 0);
	}, [tasks, columns]);

	return (
		<ul className="flex flex-col gap-4 px-8 py-4">
			{groupedTasks.length === 0 && !isLoading && (
				<div className="mt-8 flex flex-col items-start justify-center gap-2 text-center">
					<h3 className="text-2xl text-muted-foreground">
						No tasks assigned to you
					</h3>
					<p className="max-w-md text-balance text-muted-foreground text-sm">
						You can assign tasks to yourself from the task details or the board.
					</p>
				</div>
			)}
			<AnimatePresence>
				{groupedTasks.map((column) => (
					<li key={column.id}>
						<h2 className="mb-4 font-semibold text-xs">{column.name}</h2>
						<ul className="flex flex-col gap-4">
							{column.tasks.map((task) => (
								<TaskContextMenu task={task} key={task.id}>
									<li className="group flex items-center gap-2 transition-all">
										{/* <div className="flex w-0 flex-col gap-2 overflow-hidden opacity-0 transition-all duration-300 group-hover:w-fit group-hover:opacity-100">
											<Button
												type="button"
												variant={"outline"}
												size={"sm"}
												className="p-2 hover:bg-primary hover:text-primary-foreground dark:hover:bg-primary dark:hover:text-primary-foreground"
											>
												<CheckIcon />
											</Button>
										</div> */}
										<div className="w-full transition-all duration-300">
											<TaskItem task={task} />
										</div>
									</li>
								</TaskContextMenu>
							))}
						</ul>
					</li>
				))}
			</AnimatePresence>
		</ul>
	);
};

export const TaskItem = ({
	task,
}: {
	task: RouterOutputs["tasks"]["get"]["data"][number];
}) => {
	const { setParams } = useTaskParams();

	return (
		<motion.div
			role="button"
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: 10 }}
			layout
			layoutId={`task-item-${task.id}`}
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
		</motion.div>
	);
};
