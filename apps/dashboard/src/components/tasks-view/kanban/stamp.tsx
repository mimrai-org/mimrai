import { evaluateTaskSignals } from "@mimir/utils/tasks";
import { cn } from "@ui/lib/utils";
import type { KanbanTask } from "./kanban-task";

const classNames = {
	overdue: "border-1 border-red-500 text-red-500 -rotate-15",
	urgent: "border-1 border-yellow-500 text-yellow-500",
	inactive: "border-1 border-zinc-500 text-zinc-500",
};

export const KanbanTaskStamp = ({ task }: { task: KanbanTask }) => {
	const activeSignals = evaluateTaskSignals(task);
	const firstSignal = activeSignals[0];

	if (!firstSignal) {
		return null;
	}

	return (
		<div className="absolute top-8 right-8 m-1 flex items-center gap-1">
			<div
				className={cn(
					"rotate-15 rounded-sm px-2 font-medium text-sm uppercase opacity-10",
					classNames[firstSignal.key],
				)}
			>
				{firstSignal.label}
			</div>
		</div>
	);
};
