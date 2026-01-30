"use client";
import type { RouterOutputs } from "@mimir/trpc";
import { Checkbox } from "@ui/components/ui/checkbox";
import { cn } from "@ui/lib/utils";
import { LayersIcon } from "lucide-react";
import { Response } from "../chat/response";
import { propertiesComponents } from "../tasks-view/properties/task-properties-components";

export const TaskShareable = ({
	task,
}: {
	task: NonNullable<RouterOutputs["tasks"]["getById"]>;
}) => {
	return (
		<div className="space-y-4">
			<h1 className="font-medium text-2xl">{task.title}</h1>
			<div className="flex flex-wrap gap-2">
				{propertiesComponents.status(task)}
				{propertiesComponents.checklist(task)}
			</div>
			<Response>{task.description || "No description provided."}</Response>

			{task.checklistSummary?.checklist?.length > 0 && (
				<div className="space-y-2">
					{task.checklistSummary.checklist.map((item) => (
						<div
							key={item.id}
							className={cn("flex items-center gap-2 text-sm", {
								"line-through opacity-50": item.isCompleted,
							})}
						>
							<Checkbox
								checked={item.isCompleted}
								className="pointer-events-none"
							/>
							<Response>
								{item.description || "No description provided."}
							</Response>
						</div>
					))}
				</div>
			)}
		</div>
	);
};
