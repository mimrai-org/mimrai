"use client";

import { TasksView } from "@/components/tasks-view/tasks-view";
import { useUser } from "@/components/user-provider";

export default function Page() {
	const user = useUser();

	if (!user) {
		return null;
	}

	return (
		<TasksView
			defaultFilters={{
				assigneeId: [user?.id!],
				viewType: "list",
				groupBy: "none",
				statusType: ["to_do", "in_progress"],
				showEmptyColumns: false,
			}}
		/>
	);
}
