"use client";

import type { RouterOutputs } from "@api/trpc/routers";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/ui/button";
import { DialogTrigger } from "@ui/components/ui/dialog";
import { Table, TableBody, TableCell, TableRow } from "@ui/components/ui/table";
import { cn } from "@ui/lib/utils";
import { format } from "date-fns";
import {
	CheckSquare2Icon,
	CheckSquareIcon,
	CookieIcon,
	PlusIcon,
	TicketCheckIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { ColumnIcon } from "@/components/column-icon";
import {
	EmptyState,
	EmptyStateAction,
	EmptyStateDescription,
	EmptyStateIcon,
	EmptyStateTitle,
} from "@/components/empty-state";
import { Priority } from "@/components/kanban/priority";
import { TaskContextMenu } from "@/components/kanban/task-context-menu";
import { TaskItem } from "@/components/task-item";
import { useTaskParams } from "@/hooks/use-task-params";
import { useUser } from "@/hooks/use-user";
import { queryClient, trpc } from "@/utils/trpc";
import { WorkConfirmDialogTrigger } from "./work-confirm-dialog";

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
		<ul className="flex flex-col">
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
								{/* <WorkConfirmDialogTrigger asChild taskId={task.id}> */}
								<TaskItem task={task} dialog={false} />
								{/* </WorkConfirmDialogTrigger> */}
							</div>
						</li>
					</TaskContextMenu>
				))}
			</AnimatePresence>
		</ul>
	);
};
