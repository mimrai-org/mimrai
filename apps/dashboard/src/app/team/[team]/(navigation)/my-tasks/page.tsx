"use client";

import { TasksView } from "@/components/tasks-view/tasks-view";
import { useUser } from "@/hooks/use-user";

export default function Page() {
	const user = useUser();

	return (
		<TasksView
			assigneeId={[user?.id!]}
			viewType="list"
			groupBy="none"
			showEmptyColumns={false}
		/>
	);
}
