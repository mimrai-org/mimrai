import type z from "zod";

// Tool metadata for title generation and UI display
export const toolMetadata: Record<
	string,
	{ name: string; title: string; description: string; relatedTools?: string[] }
> = {
	createTask: {
		name: "createTask",
		title: "Create Task",
		description: "Create a new task in your board",
		relatedTools: ["getTasks", "getColumns", "getUsers"],
	},
	getTasks: {
		name: "getTasks",
		title: "Get Tasks",
		description: "Retrieve tasks from your board",
		relatedTools: ["getColumns"],
	},
	getColumns: {
		name: "getColumns",
		title: "Get Columns",
		description: "Retrieve columns from your board",
	},
	updateTask: {
		name: "updateTask",
		title: "Update Task",
		description: "Update an existing task in your board",
		relatedTools: ["getTasks", "getColumns"],
	},
	getUsers: {
		name: "getUsers",
		title: "Get Users",
		description: "Retrieve users from your team",
	},
	getEmails: {
		name: "getEmails",
		title: "Get Emails",
		description: "Retrieve emails from Gmail with filtering",
	},
} as const;

export type ToolName = keyof typeof toolMetadata;

export type MessageDataParts = {
	title: {
		title: string;
	};
	task: {
		id: string;
		title: string;
		description?: string;
		sequence?: number;
		status: {
			type: "to_do" | "in_progress" | "done" | "review" | "backlog";
			name: string;
			color?: string;
		};
		assignee?: string;
		dueDate?: string;
	};
	"email-draft": {
		subject: string;
		body: string;
		recipient: string;
	};
	email: {
		id: string;
		from: string;
		to: string;
		subject: string;
		date: string;
		snippet: string;
		body: string;
		mimeType: string;
		labelIds?: string[];
		threadId: string;
	};
};
