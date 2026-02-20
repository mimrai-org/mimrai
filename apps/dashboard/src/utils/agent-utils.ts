import type { AgentStatus } from "@/types/agents";

// Generate user-friendly status messages
export const getStatusMessage = (status?: AgentStatus | null) => {
	if (!status) {
		return null;
	}

	const { agent, status: state } = status;

	if (state === "routing") {
		return "Thinking...";
	}

	if (state === "executing") {
		const messages: Record<AgentStatus["agent"], string> = {
			triage: "Thinking...",
			planning: "Planning your next steps...",
			tasks: "Managing your tasks...",
			projects: "Organizing your projects...",
		};

		return messages[agent];
	}

	return null;
};

// Generate user-friendly tool messages
export const getToolMessage = (toolName: string | null) => {
	if (!toolName) return null;

	const toolMessages: Record<string, string> = {
		createTask: "Creating task...",
		updateTask: "Updating task...",
		getTasks: "Fetching tasks...",
		getTaskById: "Fetching task details...",
		addTaskAttachment: "Adding task attachment...",
		getTaskAttachment: "Fetching task attachment...",
		createTaskComment: "Creating task comment...",
		createTaskPullRequest: "Creating task pull request...",
		createChecklistItem: "Creating checklist item...",
		updateChecklistItem: "Updating checklist item...",
		getChecklistItems: "Fetching checklist items...",
		getStatuses: "Fetching statuses...",
		getUsers: "Fetching users...",
		createProject: "Creating project...",
		updateProject: "Updating project...",
		getProjects: "Fetching projects...",
		createLabel: "Creating label...",
		getLabels: "Fetching labels...",
		getColumns: "Fetching columns...",
		createMilestone: "Creating milestone...",
		updateMilestone: "Updating milestone...",
		getMilestones: "Fetching milestones...",
		getDocuments: "Fetching documents...",
		getDocumentById: "Fetching document details...",
		createDocument: "Creating document...",
		updateDocument: "Updating document...",
		deleteDocument: "Deleting document...",
		switchToolbox: "Switching toolbox...",
		createAgent: "Creating agent...",
		getAgents: "Fetching agents...",
		webSearch: "Searching the web...",
		createAssistantJob: "Scheduling assistant job...",
		getAssistantJobs: "Fetching scheduled jobs...",
		updateAssistantJob: "Updating assistant job...",
		deleteAssistantJob: "Deleting assistant job...",
		saveAgentMemory: "Saving memory...",
		recallAgentMemories: "Recalling memories...",
		updateAgentMemory: "Updating memory...",
		bumpAgentMemoryRelevance: "Updating memory relevance...",
		createDraftEmail: "Creating draft email...",
		sendDraftEmail: "Sending draft email...",
		getEmails: "Fetching emails...",
		createCalendarEvent: "Creating calendar event...",
		updateCalendarEvent: "Updating calendar event...",
		deleteCalendarEvent: "Deleting calendar event...",
		getCalendarEvents: "Fetching calendar events...",
		taskAutocomplete: "Autocompleting task details...",
	};

	const mappedMessage = toolMessages[toolName];
	if (mappedMessage) {
		return mappedMessage;
	}

	const readableToolName = toolName
		.replace(/^mcp:/, "")
		.replace(/[_-]+/g, " ")
		.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
		.toLowerCase()
		.trim();

	return readableToolName ? `Running ${readableToolName}...` : "Running tool...";
};
