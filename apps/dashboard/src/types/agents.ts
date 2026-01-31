/**
 * Extended agent status type with application-specific agent names
 */
export type AgentStatus = {
	status: "routing" | "executing" | "completing";
	agent: "triage" | "planning" | "tasks" | "projects";
};

/**
 * Extended data parts interface with application-specific data
 */
export interface AppDataParts {
	"agent-status": AgentStatus;
}

export type AgentUIMessage = any; // Placeholder - can be refined if needed
