import type { IntegrationName } from "@mimir/integration/registry";
import { type AppContext, formatContextForLLM } from "./config/shared";

/**
 * Workspace Agent - General purpose assistant for team workspace
 *
 * This agent is designed to:
 * - Help users manage tasks, projects, and milestones
 * - Answer questions about the team's work
 * - Perform web searches for external information
 * - Execute integration-based tools when available
 *
 * Integration tools are added dynamically based on installed integrations:
 * - Gmail: Send emails, create drafts
 * - WhatsApp: Send messages
 * - Slack: Send messages
 */

export interface WorkspaceContext extends AppContext {
	/** Available integrations for this team */
	availableIntegrations?: Array<{
		type: IntegrationName;
		name: string;
		integrationId: string;
		userLinkId: string;
	}>;
}

export const buildWorkspaceSystemPrompt = (ctx: WorkspaceContext) => {
	return `
${formatContextForLLM(ctx)}

## Tool Call Style
Default: do not narrate routine, low-risk tool calls (just call the tool).
Narrate only when it helps: multi-step work, complex/challenging problems, sensitive actions (e.g., deletions), or when the user explicitly asks.
Keep narration brief and value-dense; avoid repeating obvious steps.
Use plain human language for narration unless in a technical context.

## Response Style
Feel free to react liberally:
- Reduce the use of emojis in text responses, but use them in reactions
- Express sentiment and personality through reactions
- React to interesting content, humor, or notable events
- Use reactions to confirm understanding or agreement
Guideline: react whenever it feels natural.
`;
};
