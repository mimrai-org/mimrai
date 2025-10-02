// Tool metadata for title generation and UI display
export const toolMetadata: Record<
	string,
	{ name: string; title: string; description: string; relatedTools?: string[] }
> = {
	createTask: {
		name: "createTask",
		title: "Create Task",
		description: "Create a new task in your task manager",
		relatedTools: ["getTasks", "getColumns"],
	},
	getTasks: {
		name: "getTasks",
		title: "Get Tasks",
		description: "Retrieve tasks from your task manager",
		relatedTools: ["getColumns"],
	},
	getColumns: {
		name: "getColumns",
		title: "Get Columns",
		description: "Retrieve columns from your task manager",
	},
	updateTask: {
		name: "updateTask",
		title: "Update Task",
		description: "Update an existing task in your task manager",
		relatedTools: ["getTasks", "getColumns"],
	},
	getUsers: {
		name: "getUsers",
		title: "Get Users",
		description: "Retrieve users from your team",
	},
} as const;

export type ToolName = keyof typeof toolMetadata;

export type MessageDataParts = {
	title: {
		title: string;
	};
};
