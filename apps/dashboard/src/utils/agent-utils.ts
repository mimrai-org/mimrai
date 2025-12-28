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
		createTaskPullRequest: "Creating task pull request...",
		createChecklistItem: "Creating checklist item...",
		updateChecklistItem: "Updating checklist item...",
		getChecklistItems: "Fetching checklist items...",
		createProject: "Creating project...",
		updateProject: "Updating project...",
		getProjects: "Fetching projects...",
		createLabel: "Creating label...",
		getLabels: "Fetching labels...",
		getColumns: "Fetching columns...",
		createMilestone: "Creating milestone...",
		updateMilestone: "Updating milestone...",
		getMilestones: "Fetching milestones...",
		taskAutocomplete: "Autocompleting task details...",
	};

	return toolMessages[toolName];
};
