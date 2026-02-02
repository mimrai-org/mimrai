import type { MessageDataParts } from "@api/ai/tools/registry";
import type { UIChatMessage } from "@api/ai/types";
import { cn } from "@ui/lib/utils";
import { useTaskPanel } from "@/components/panels/task-panel";
import { StatusIcon } from "@/components/status-icon";

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

	return (
		<button
			type="button"
			className="text-left"
			onClick={() => {
				taskPanel.open(task?.id);
			}}
		>
			<span
				className={cn(
					"inline-flex items-center gap-1.5 rounded-md border bg-muted/50 px-2 py-0.5 align-middle font-medium text-sm transition-colors hover:bg-muted",
				)}
			>
				<StatusIcon {...task.status} className="size-3.5 shrink-0" />
				{task.sequence >= 0 && (
					<span className="text-muted-foreground text-xs">
						#{task.sequence}
					</span>
				)}
				<span
					className={cn(
						"max-w-[350px] truncate",
						task.status.type === "done" && "text-muted-foreground line-through",
					)}
				>
					{task?.title}
				</span>
			</span>
		</button>
	);
};
