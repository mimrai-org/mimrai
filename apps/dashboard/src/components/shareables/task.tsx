import type { RouterOutputs } from "@api/trpc/routers";
import { Checkbox } from "@ui/components/ui/checkbox";
import { cn } from "@ui/lib/utils";
import { LayersIcon } from "lucide-react";
import { Response } from "../chat/response";
import { propertiesComponents } from "../task-properties";

export const TaskShareable = ({
	task,
}: {
	task: NonNullable<RouterOutputs["tasks"]["getById"]>;
}) => {
	return (
		<div className="space-y-4">
			<h1 className="font-medium font-runic text-2xl">{task.title}</h1>
			<div className="flex flex-wrap gap-2">
				{propertiesComponents.column(task)}
				{propertiesComponents.checklist(task)}
			</div>
			<Response>{task.description || "No description provided."}</Response>

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
		</div>
	);
};

export const TaskShareableOgImage = ({
	task,
}: {
	task: NonNullable<RouterOutputs["tasks"]["getById"]>;
}) => {
	return (
		<div
			style={{
				fontSize: 64,
				background: "white",
				width: "100%",
				height: "100%",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			<LayersIcon />
			{task.title}
		</div>
	);
};
