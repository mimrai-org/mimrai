export type ToolCacheKey =
	| "tasks"
	| "projects"
	| "milestones"
	| "labels"
	| "documents"
	| "agents";

type AgentToolMetadata = {
	message: string;
	invalidate?: ToolCacheKey[];
};

export const AGENT_TOOL_METADATA: Record<string, AgentToolMetadata> = {
	createTask: { message: "Creating task...", invalidate: ["tasks"] },
	updateTask: { message: "Updating task...", invalidate: ["tasks"] },
	getTasks: { message: "Fetching tasks..." },
	getTaskById: { message: "Fetching task details..." },
	addTaskAttachment: { message: "Adding task attachment..." },
	getTaskAttachment: { message: "Fetching task attachment..." },
	createTaskComment: {
		message: "Creating task comment...",
		invalidate: ["tasks"],
	},
	createTaskPullRequest: {
		message: "Creating task pull request...",
		invalidate: ["tasks"],
	},
	createChecklistItem: {
		message: "Creating checklist item...",
		invalidate: ["tasks"],
	},
	updateChecklistItem: {
		message: "Updating checklist item...",
		invalidate: ["tasks"],
	},
	getChecklistItems: { message: "Fetching checklist items..." },
	getStatuses: { message: "Fetching statuses..." },
	getUsers: { message: "Fetching users..." },
	createProject: {
		message: "Creating project...",
		invalidate: ["projects", "tasks"],
	},
	updateProject: {
		message: "Updating project...",
		invalidate: ["projects", "tasks"],
	},
	getProjects: { message: "Fetching projects..." },
	createLabel: {
		message: "Creating label...",
		invalidate: ["labels", "tasks"],
	},
	getLabels: { message: "Fetching labels..." },
	getColumns: { message: "Fetching columns..." },
	createMilestone: {
		message: "Creating milestone...",
		invalidate: ["milestones", "tasks"],
	},
	updateMilestone: {
		message: "Updating milestone...",
		invalidate: ["milestones", "tasks"],
	},
	getMilestones: { message: "Fetching milestones..." },
	getDocuments: { message: "Fetching documents..." },
	getDocumentById: { message: "Fetching document details..." },
	createDocument: {
		message: "Creating document...",
		invalidate: ["documents"],
	},
	updateDocument: {
		message: "Updating document...",
		invalidate: ["documents"],
	},
	deleteDocument: {
		message: "Deleting document...",
		invalidate: ["documents"],
	},
	switchToolbox: { message: "Switching toolbox..." },
	createAgent: { message: "Creating agent...", invalidate: ["agents"] },
	getAgents: { message: "Fetching agents..." },
	webSearch: { message: "Searching the web..." },
	createAssistantJob: { message: "Scheduling assistant job..." },
	getAssistantJobs: { message: "Fetching scheduled jobs..." },
	updateAssistantJob: { message: "Updating assistant job..." },
	deleteAssistantJob: { message: "Deleting assistant job..." },
	saveAgentMemory: { message: "Saving memory..." },
	recallAgentMemories: { message: "Recalling memories..." },
	updateAgentMemory: { message: "Updating memory..." },
	bumpAgentMemoryRelevance: { message: "Updating memory relevance..." },
	createDraftEmail: { message: "Creating draft email..." },
	sendDraftEmail: { message: "Sending draft email..." },
	getEmails: { message: "Fetching emails..." },
	createCalendarEvent: { message: "Creating calendar event..." },
	updateCalendarEvent: { message: "Updating calendar event..." },
	deleteCalendarEvent: { message: "Deleting calendar event..." },
	getCalendarEvents: { message: "Fetching calendar events..." },
	taskAutocomplete: { message: "Autocompleting task details..." },
};
