// Tool metadata for title generation and UI display
export const toolMetadata = {
	createTask: {
		name: "createTask",
		title: "Create Task",
		description: "Create a new task in your task manager",
	},
} as const;

export type ToolName = keyof typeof toolMetadata;

export type MessageDataParts = {
	title: {
		title: string;
	};
};
