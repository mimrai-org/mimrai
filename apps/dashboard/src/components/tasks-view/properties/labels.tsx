import { LabelBadge } from "@ui/components/ui/label-badge";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@ui/components/ui/tooltip";
import { useMemo } from "react";
import type { Task } from "./task-properties-components";

export const TaskPropertyLabels = (task: {
	labels: Pick<Task, "labels">["labels"];
}) => {
	const meta = useMemo(() => {
		if (!task.labels || task.labels.length === 0) return null;

		const firstLabel = task.labels[0];
		const hasMoreThanOne = task.labels.length > 1;

		return { firstLabel, hasMoreThanOne };
	}, [task.labels]);

	if (!meta) return null;

	return (
		<div className="flex max-w-[180px] items-center gap-2 overflow-x-hidden">
			{meta.firstLabel && (
				<LabelBadge variant="secondary" {...meta.firstLabel} />
			)}
			{meta.hasMoreThanOne && (
				<Tooltip>
					<TooltipTrigger asChild>
						<span className="text-muted-foreground text-xs">
							+{task.labels.length - 1}
						</span>
					</TooltipTrigger>
					<TooltipContent>
						<div className="flex flex-wrap gap-2">
							{task.labels.slice(1).map((label) => (
								<LabelBadge
									key={label.id}
									variant="default"
									{...label}
									className="bg-transparent"
								/>
							))}
						</div>
					</TooltipContent>
				</Tooltip>
			)}
		</div>
	);
};
