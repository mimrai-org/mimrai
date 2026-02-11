import { Suspense } from "react";
import { TasksView } from "@/components/tasks-view/tasks-view";

export default function Page() {
	return (
		<Suspense>
			<div className="h-full">
				<TasksView
					defaultFilters={{
						viewType: "list",
						recurring: true,
						showEmptyColumns: false,
						statusType: ["backlog", "done", "in_progress", "review", "to_do"],
						view: "list",
						groupBy: "project",
					}}
				/>
			</div>
		</Suspense>
	);
}
