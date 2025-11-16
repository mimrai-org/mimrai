import type { RouterOutputs } from "@api/trpc/routers";
import { LabelBadge } from "@ui/components/ui/label-badge";
import { format } from "date-fns";
import { CheckSquareIcon } from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { Fragment } from "react";
import { useTaskParams } from "@/hooks/use-task-params";
import { cn } from "@/lib/utils";
import { queryClient, trpc } from "@/utils/trpc";
import { ColumnIcon } from "./column-icon";
import { AssigneeAvatar } from "./kanban/asignee";
import { Priority } from "./kanban/priority";
import { ProjectIcon } from "./project-icon";

type Task = RouterOutputs["tasks"]["get"]["data"][number];
const propertiesComponents = {
	labels: (task: Task) => (
		<div className="flex gap-2">
			{task.labels?.map((label) => (
				<LabelBadge key={label.id} {...label} />
			))}
		</div>
	),
	assignee: (task: Task) => <AssigneeAvatar {...task.assignee} />,
	priority: (task: Task) => task.priority && <Priority value={task.priority} />,
	dueDate: (task: Task) =>
		task.dueDate && (
			<time className="flex h-5.5 items-center bg-secondary px-2 text-xs tabular-nums">
				{format(new Date(task.dueDate), "PP")}
			</time>
		),
	column: (task: Task) =>
		task.column && (
			<time className="flex h-5.5 items-center bg-secondary px-2 text-xs tabular-nums">
				<ColumnIcon {...task.column} className="size-3.5" />
				<span className="ml-1">{task.column.name}</span>
			</time>
		),
	checklist: (task: Task) =>
		task.checklistSummary?.total > 0 && (
			<div
				className={cn("flex h-5.5 items-center text-muted-foreground text-xs", {
					"bg-primary px-2 text-primary-foreground":
						task.checklistSummary.completed === task.checklistSummary.total,
				})}
			>
				<CheckSquareIcon className="mr-1 inline size-3.5" />
				{task.checklistSummary.completed}/{task.checklistSummary.total}
			</div>
		),
	project: (task: Task) =>
		task.project && (
			<span className="flex h-5.5 items-center gap-2 bg-secondary px-2 text-xs">
				<ProjectIcon className="size-3.5" {...task.project} />
				{task.project.name}
			</span>
		),
};

type Property = keyof typeof propertiesComponents;

export const TaskItem = ({
	task,
	className,
	dialog = true,
	disableEvent = false,
	onClick,
	properties = [
		"priority",
		"dueDate",
		"column",
		"project",
		"checklist",
		"labels",
		"assignee",
	],
}: {
	task: RouterOutputs["tasks"]["get"]["data"][number];
	className?: string;
	onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
	dialog?: boolean;
	disableEvent?: boolean;
	properties?: Property[];
}) => {
	const router = useRouter();
	const { setParams } = useTaskParams();

	return (
		<motion.button
			type="button"
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: 10 }}
			layout
			layoutId={`task-${task.id}`}
			className={cn(
				"flex w-full flex-col justify-between gap-2 border-b p-4 transition-colors hover:bg-accent/50 sm:flex-row",
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
					router.push(`/dashboard/workstation/${task.id}`);
				}
			}}
		>
			<div className="flex items-center gap-2 text-start text-sm">
				{task.sequence && (
					<span className="text-muted-foreground">{task.sequence}</span>
				)}
				<h3 className="font-medium">{task.title}</h3>
			</div>
			<div className="flex flex-wrap items-center justify-end gap-2">
				{properties.map((property) => (
					<Fragment key={property}>
						{propertiesComponents[property](task)}
					</Fragment>
				))}
			</div>
		</motion.button>
	);
};
