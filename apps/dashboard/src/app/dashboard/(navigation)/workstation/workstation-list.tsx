"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import { Checkbox } from "@ui/components/ui/checkbox";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@ui/components/ui/collapsible";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@ui/components/ui/dropdown-menu";
import { cn } from "@ui/lib/utils";
import { ChevronRightIcon, CookieIcon, PlusIcon } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Response } from "@/components/chat/response";
import { ColumnIcon } from "@/components/column-icon";
import {
	EmptyState,
	EmptyStateAction,
	EmptyStateDescription,
	EmptyStateIcon,
	EmptyStateTitle,
} from "@/components/empty-state";
import { TaskContextMenu } from "@/components/kanban/task-context-menu";
import { TaskItem } from "@/components/task-item";
import { useTaskParams } from "@/hooks/use-task-params";
import { useUser } from "@/hooks/use-user";
import { queryClient, trpc } from "@/utils/trpc";

export const WorkstationList = () => {
	const user = useUser();
	const router = useRouter();
	const { setParams } = useTaskParams();

	const { data: tasks, isLoading } = useQuery(
		trpc.tasks.get.queryOptions({
			assigneeId: user?.id ? [user?.id] : [],
			view: "workstation",
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

	if (tasks?.data.length === 0 && !isLoading) {
		return (
			<EmptyState>
				<EmptyStateIcon>
					<CookieIcon className="size-full" />
				</EmptyStateIcon>
				<EmptyStateTitle>You get a cookie!</EmptyStateTitle>
				<EmptyStateDescription>
					Either you have no tasks assigned to you, or you've completed them
					all. Take a moment to relax or check back later for new tasks.
				</EmptyStateDescription>
				<EmptyStateAction>
					<Button
						variant="outline"
						onClick={() => setParams({ createTask: true })}
					>
						<PlusIcon />
						Create a task
					</Button>
				</EmptyStateAction>
			</EmptyState>
		);
	}

	return (
		<ul className="flex flex-col gap-4">
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
						<li className="group gap-2 rounded-sm bg-background px-4 transition-all hover:bg-background/80">
							<div className="flex w-full items-center gap-4 transition-all duration-300">
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Checkbox checked={task.column.type === "done"} />
									</DropdownMenuTrigger>
									<DropdownMenuContent>
										{columns?.data
											?.filter((column) => column.id !== task.columnId)
											.map((column) => (
												<DropdownMenuItem
													key={column.id}
													onClick={() => {
														updateTask({ id: task.id, columnId: column.id });
													}}
												>
													<ColumnIcon type={column.type} className="size-4" />
													{column.name}
												</DropdownMenuItem>
											))}
									</DropdownMenuContent>
								</DropdownMenu>
								{/* <WorkConfirmDialogTrigger asChild taskId={task.id}> */}
								<TaskItem
									task={task}
									className="border-0 bg-transparent px-0 hover:bg-transparent"
								/>

								{/* </WorkConfirmDialogTrigger> */}
							</div>
							{task.checklistSummary?.checklist?.length! > 0 && (
								<div className="space-y-2 pb-4">
									<Collapsible className="group/checklist">
										<CollapsibleTrigger className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
											<div className="transition-all group-data-[state=open]/checklist:rotate-90">
												<ChevronRightIcon className="size-4" />
												<span className="sr-only">Toggle</span>
											</div>
											<div className="font-medium text-sm">Checklist</div>
										</CollapsibleTrigger>
										<CollapsibleContent>
											<div className="ml-6">
												{task.checklistSummary?.checklist?.map((checklist) => (
													<div
														key={checklist.id}
														className="flex items-center gap-2 py-2.5 text-muted-foreground text-sm"
													>
														<Checkbox checked={checklist.isCompleted} />
														<Response
															className={cn({
																"text-muted-foreground line-through":
																	checklist.isCompleted,
															})}
														>
															{checklist.description}
														</Response>
													</div>
												))}
											</div>
										</CollapsibleContent>
									</Collapsible>
								</div>
							)}
						</li>
					</TaskContextMenu>
				))}
			</AnimatePresence>
		</ul>
	);
};
