"use client";
import type { RouterOutputs } from "@api/trpc/routers";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useTaskParams } from "@/hooks/use-task-params";
import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils";
import { queryClient, trpc } from "@/utils/trpc";
import { TaskProperty } from "../properties/task-properties";
import type { propertiesComponents } from "../properties/task-properties-components";

type Property = keyof typeof propertiesComponents;

export const TaskItem = ({
	task,
	className,
	dialog = true,
	disableEvent = false,
	onClick,
}: {
	task: RouterOutputs["tasks"]["get"]["data"][number];
	className?: string;
	onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
	dialog?: boolean;
	disableEvent?: boolean;
}) => {
	const router = useRouter();
	const user = useUser();
	const { setParams } = useTaskParams();

	return (
		<div className="flex items-center gap-2 transition-colors hover:bg-card">
			{/* <Checkbox /> */}
			<motion.button
				type="button"
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: 10 }}
				className={cn(
					"flex w-full flex-col justify-between gap-2 bg-transparent px-4 py-2 sm:flex-row",
					className,
				)}
				onClick={(e) => {
					queryClient.setQueryData(
						trpc.tasks.getById.queryKey({ id: task.id }),
						task,
					);

					if (onClick) {
						onClick(e);
						return;
					}

					if (disableEvent) {
						return;
					}

					if (dialog) {
						setParams({ taskId: task.id });
					} else {
						router.push(`${user?.basePath}/tasks/${task.id}`);
					}
				}}
			>
				<div className="flex items-center gap-2 text-start text-sm">
					<TaskProperty property="priority" task={task} />
					{task.sequence !== null && (
						<span className="text-muted-foreground text-xs tabular-nums">
							{user?.team?.prefix}-{task.sequence}
						</span>
					)}
					<TaskProperty property="status" task={task} />
					<h3 className="font-medium">{task.title}</h3>
				</div>
				<div className="hidden flex-wrap items-center justify-end gap-2 md:flex">
					<TaskProperty property="dependencies" task={task} />
					<TaskProperty property="dueDate" task={task} />
					<TaskProperty property="project" task={task} />
					<TaskProperty property="milestone" task={task} />
					<TaskProperty property="assignee" task={task} />
				</div>
			</motion.button>
		</div>
	);
};
