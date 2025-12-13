"use client";

import { TasksView } from "@/components/tasks-view/tasks-view";

export default function Page() {
	return <TasksView viewType="list" groupBy="none" showEmptyColumns={false} />;
}
