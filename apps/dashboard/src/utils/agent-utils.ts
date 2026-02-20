import type { AgentStatus } from "@/types/agents";
import { AGENT_TOOL_METADATA } from "./agent-tool-metadata";

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

	const mappedMessage = AGENT_TOOL_METADATA[toolName]?.message;
	if (mappedMessage) {
		return mappedMessage;
	}

	const readableToolName = toolName
		.replace(/^mcp:/, "")
		.replace(/[_-]+/g, " ")
		.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
		.toLowerCase()
		.trim();

	return readableToolName
		? `Running ${readableToolName}...`
		: "Running tool...";
};
