import type { MessageDataParts } from "@api/ai/tools/tool-registry";
import type { UIChatMessage } from "@api/ai/types";
import { cn } from "@ui/lib/utils";
import { useMemo } from "react";
import { useTaskPanel } from "@/components/panels/task-panel";
import { StatusIcon } from "@/components/status-icon";
import { useStatuses } from "@/hooks/use-data";

export const TaskArtifactMessage = ({
	message,
}: {
	message: UIChatMessage;
}) => {
	const taskParts = message.parts.filter((part) => part.type === "data-task");
	if (taskParts.length === 0) return null;

	return (
		<div className="flex flex-col gap-2">
			{taskParts.map((part, index) => (
				<TaskArtifact key={index} task={part.data} />
			))}
		</div>
	);
};

export const TaskArtifact = ({ task }: { task: MessageDataParts["task"] }) => {
	const taskPanel = useTaskPanel();
	const { data: statuses } = useStatuses();

	const taskWithStatus = useMemo(() => {
		return {
			...task,
			status: statuses.data.find((s) => s.id === task.statusId),
		};
	}, [task, statuses]);

	return (
		<button
			type="button"
			className="text-left"
			onClick={() => {
				taskPanel.open(taskWithStatus?.id);
			}}
		>
			<span
				className={cn(
					"inline-flex items-center gap-1.5 rounded-md border bg-muted/50 px-2 py-0.5 align-middle font-medium text-sm transition-colors hover:bg-muted",
				)}
			>
				<StatusIcon {...taskWithStatus.status} className="size-3.5 shrink-0" />
				{taskWithStatus.sequence >= 0 && (
					<span className="text-muted-foreground text-xs">
						#{taskWithStatus.sequence}
					</span>
				)}
				<span
					className={cn(
						"max-w-[350px] truncate",
						taskWithStatus.status.type === "done" &&
							"text-muted-foreground line-through",
					)}
				>
					{taskWithStatus?.title}
				</span>
			</span>
		</button>
	);
};
