import type { RouterOutputs } from "@api/trpc/routers";
import { cn } from "@ui/lib/utils";
import { ColumnIcon } from "@/components/column-icon";
import { propertiesComponents } from "@/components/task-properties";

export const ProjectBoardShareable = ({
	tasks,
}: {
	tasks: NonNullable<RouterOutputs["tasks"]["get"]>;
}) => {
	const groupedTasks = tasks.data.reduce(
		(groups, task) => {
			const column = task.column.name || "Uncategorized";
			if (!groups[column]) {
				groups[column] = [];
			}
			groups[column].push(task);
			return groups;
		},
		{} as Record<string, typeof tasks.data>,
	);

	const findColumnByName = (name: string) => {
		return tasks.data.find((task) => task.column.name === name)?.column;
	};

	const renderColumnIcon = (name: string) => {
		const column = findColumnByName(name);
		if (!column) return null;
		return <ColumnIcon {...column} className="size-4" />;
	};

	return (
		<div className="my-8">
			{Object.entries(groupedTasks).map(([columnName, columnTasks]) => (
				<div key={columnName} style={{ marginBottom: "2rem" }}>
					<h3 className="mb-2 flex items-center gap-2 font-medium text-sm">
						{renderColumnIcon(columnName)}
						{columnName}
					</h3>
					<ul className="space-y-2">
						{columnTasks.map((task) => (
							<li
								key={task.id}
								className="flex flex-col gap-1 bg-secondary px-2 py-2 text-sm"
							>
								<h4
									className={cn("font-medium", {
										"text-muted-foreground line-through":
											task.column.type === "done",
									})}
								>
									{task.title}
								</h4>
								{propertiesComponents.checklist(task)}
							</li>
						))}
					</ul>
				</div>
			))}
		</div>
	);
};
