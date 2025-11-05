"use client";

import type { RouterOutputs } from "@api/trpc/routers";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableRow } from "@ui/components/ui/table";
import { cn } from "@ui/lib/utils";
import { format } from "date-fns";
import { CheckSquareIcon } from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { ColumnIcon } from "@/components/column-icon";
import { Priority } from "@/components/kanban/priority";
import { TaskContextMenu } from "@/components/kanban/task-context-menu";
import { useTaskParams } from "@/hooks/use-task-params";
import { useUser } from "@/hooks/use-user";
import { queryClient, trpc } from "@/utils/trpc";

export const WorkstationList = () => {
	const user = useUser();
	const router = useRouter();

	const { data: tasks, isLoading } = useQuery(
		trpc.tasks.get.queryOptions({
			assigneeId: user?.id ? [user?.id] : [],
			view: "workstation",
		}),
	);

	return (
		<>
			<Table>
				<TableBody>
					{tasks?.data.map((task) => (
						<TaskContextMenu task={task} key={task.id}>
							<TableRow
								key={task.id}
								className="cursor-pointer hover:bg-accent/50"
								onClick={() => {
									queryClient.setQueryData(
										trpc.tasks.getById.queryKey({ id: task.id }),
										task,
									);
									router.push(`/dashboard/workstation/${task.id}`);
								}}
							>
								<TableCell className="flex items-center gap-2 py-4">
									{task.priority ? <Priority value={task.priority} /> : <div />}
									{task.sequence !== null && (
										<span className="text-muted-foreground">
											{task.sequence}
										</span>
									)}
									<span className="font-medium">{task.title}</span>
								</TableCell>
								<TableCell>
									{task.dueDate && (
										<time className="text-xs tabular-nums">
											{format(new Date(task.dueDate), "PP")}
										</time>
									)}
								</TableCell>
								<TableCell>
									{task.column && (
										<time className="flex items-center gap-1 tabular-nums">
											<ColumnIcon {...task.column} className="size-3.5" />
											<span className="ml-1">{task.column.name}</span>
										</time>
									)}
								</TableCell>
								<TableCell className="flex justify-end">
									{task.checklistSummary?.total > 0 && (
										<div
											className={cn("flex items-center text-muted-foreground", {
												"text-foreground":
													task.checklistSummary.completed ===
													task.checklistSummary.total,
											})}
										>
											<CheckSquareIcon className="mr-1 inline size-3.5" />
											{task.checklistSummary.completed}/
											{task.checklistSummary.total}
										</div>
									)}
								</TableCell>
							</TableRow>
						</TaskContextMenu>
					))}
				</TableBody>
			</Table>
			{/* <ul className="flex flex-col">
				{tasks?.data.length === 0 && !isLoading && (
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
					{tasks?.data.map((task) => (
						<TaskContextMenu task={task} key={task.id}>
							<li className="group flex items-center gap-2 transition-all">
								<div className="w-full transition-all duration-300">
									<TaskItem task={task} />
								</div>
							</li>
						</TaskContextMenu>
					))}
				</AnimatePresence>
			</ul> */}
		</>
	);
};

export const TaskItem = ({
	task,
}: {
	task: RouterOutputs["tasks"]["get"]["data"][number];
}) => {
	const router = useRouter();
	const { setParams } = useTaskParams();

	return (
		<motion.div
			role="button"
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: 10 }}
			layout
			layoutId={`task-item-${task.id}`}
			className="flex w-full flex-col gap-2 border-b p-4 transition-colors hover:bg-accent/50"
			onClick={() => {
				queryClient.setQueryData(
					trpc.tasks.getById.queryKey({ id: task.id }),
					task,
				);
				router.push(`/dashboard/workstation/${task.id}`);
				// setParams({ taskId: task.id });
			}}
		>
			<div className="flex items-center justify-between text-sm">
				<div className="flex gap-2">
					{task.priority ? <Priority value={task.priority} /> : <div />}
					{task.sequence !== null && (
						<span className="text-muted-foreground">{task.sequence}</span>
					)}
					<span className="font-medium">{task.title}</span>
				</div>
				<div className="flex items-center gap-2">
					{task.dueDate && (
						<time className="flex h-5.5 items-center bg-secondary px-2 text-xs tabular-nums">
							{format(new Date(task.dueDate), "PP")}
						</time>
					)}
					{task.column && (
						<time className="flex h-5.5 items-center bg-secondary px-2 text-xs tabular-nums">
							<ColumnIcon {...task.column} className="size-3.5" />
							<span className="ml-1">{task.column.name}</span>
						</time>
					)}
					{task.checklistSummary?.total > 0 && (
						<div
							className={cn(
								"flex h-5.5 items-center text-muted-foreground text-xs",
								{
									"bg-primary px-2 text-primary-foreground":
										task.checklistSummary.completed ===
										task.checklistSummary.total,
								},
							)}
						>
							<CheckSquareIcon className="mr-1 inline size-3.5" />
							{task.checklistSummary.completed}/{task.checklistSummary.total}
						</div>
					)}
				</div>
			</div>
		</motion.div>
	);
};
