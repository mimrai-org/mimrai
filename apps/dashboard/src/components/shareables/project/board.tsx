import type { RouterOutputs } from "@api/trpc/routers";
import { cn } from "@ui/lib/utils";
import { StatusIcon } from "@/components/status-icon";
import { propertiesComponents } from "@/components/tasks-view/properties/task-properties-components";

export const ProjectBoardShareable = ({
	tasks,
}: {
	tasks: NonNullable<RouterOutputs["tasks"]["get"]>;
}) => {
	const groupedTasks = tasks.data.reduce(
		(groups, task) => {
			const column = task.status.name || "Uncategorized";
			if (!groups[column]) {
				groups[column] = {
					tasks: [],
					order: task.status.order || 0,
				};
			}
			groups[column].tasks.push(task);
			return groups;
		},
		{} as Record<
			string,
			{
				tasks: typeof tasks.data;
				order: number;
			}
		>,
	);

	const sortedColumns = Object.entries(groupedTasks).sort(
		([, a], [, b]) => b.order - a.order,
	);

	const findColumnByName = (name: string) => {
		return tasks.data.find((task) => task.status.name === name)?.status;
	};

	const renderColumnIcon = (name: string) => {
		const column = findColumnByName(name);
		if (!column) return null;
		return <StatusIcon {...column} className="size-4" />;
	};

	return (
		<div className="my-8">
			{sortedColumns.map(([columnName, columnTasks]) => (
				<div key={columnName} style={{ marginBottom: "2rem" }}>
					<h3 className="mb-2 flex items-center gap-2 font-medium text-sm">
						{renderColumnIcon(columnName)}
						{columnName}
					</h3>
					<ul className="space-y-2">
						{columnTasks.tasks.map((task) => (
							<li
								key={task.id}
								className="flex flex-col gap-2 rounded-sm bg-secondary px-2 py-2 text-sm"
							>
								<h4
									className={cn("font-medium", {
										"text-muted-foreground line-through":
											task.status.type === "done",
									})}
								>
									{task.title}
								</h4>
								<div className="flex flex-wrap gap-2">
									{propertiesComponents.checklist(task)}
								</div>
							</li>
						))}
					</ul>
				</div>
			))}
		</div>
	);
};
