import type { TaskView } from "./list";

const commonMeta = {
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),
	isDefault: false,
	projectId: null as string,
	teamId: null as string,
	userId: null as string,
	viewType: "board",
};

export const DEFAULT_VIEWS: TaskView[] = [
	{
		id: "my-tasks",
		name: "My Tasks",
		description: "Tasks assigned to me.",
		filters: {
			viewType: "list",
			assigneeId: ["me"],
			statusType: ["to_do", "in_progress", "review"],
			groupBy: "none",
		},
		...commonMeta,
	},
	{
		id: "board",
		name: "Board",
		description: "Visualize tasks in a kanban board format.",
		filters: {
			viewType: "board",
			statusType: ["to_do", "in_progress", "review", "done"],
			showEmptyColumns: true,
		},
		...commonMeta,
	},
	{
		id: "backlog",
		name: "Backlog",
		description: "Backlog of tasks to be prioritized.",
		filters: {
			viewType: "list",
			statusType: ["backlog"],
			showEmptyColumns: false,
		},
		...commonMeta,
	},
];
