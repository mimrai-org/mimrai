import type { ChatUserContext } from "@api/ai/chat-cache";
import type { UIChatMessage } from "@api/ai/types";
import {
	type ContextItem,
	formatLLMContextItems,
} from "@api/ai/utils/format-context-items";
import {
	generateText,
	InvalidToolInputError,
	NoSuchToolError,
	Output,
	type ToolCallRepairFunction,
	type ToolExecutionOptions,
	type UIMessageStreamWriter,
} from "ai";

/**
 * Extract and validate AppContext from tool execution options.
 * Replaces unsafe `executionOptions.experimental_context as AppContext` casts
 * with a runtime check that throws a descriptive error.
 */
export function getToolContext(
	executionOptions: ToolExecutionOptions,
): AppContext {
	const ctx = executionOptions.experimental_context;
	if (
		!ctx ||
		typeof ctx !== "object" ||
		!("userId" in ctx) ||
		!("teamId" in ctx)
	) {
		throw new Error(
			"Tool executed without a valid AppContext. Ensure the agent was initialized with experimental_context.",
		);
	}
	return ctx as AppContext;
}

export function formatContextForLLM(context: AppContext): string {
	return `
## Documents
Documents are a source of knowledge for the workspace. They can contain important information about projects, processes, or general knowledge.
Always refer to documents when answering questions or providing information. Use tools like getDocuments to find relevant documents and extract information from them.
You can also manage documents by creating summaries, linking them to projects or tasks, and keeping them organized for easy access.

### Relevant documents specified for your reference (mandatory):
Before responding, check if any of the following documents are relevant to the user's query or task:
- If exactly one document applies, use the getDocumentById tool to access the content. Then read/follow it.
- If multiple could apply: choose the most specific one, then read/follow it.
${
	context.documentsOfInterest
		?.map((doc) => `- ${doc.name} (ID: ${doc.id})`)
		.join("\n") ?? "No specific documents provided."
}

## Team & User Information
User: ${context.fullName}
User ID: ${context.userId} (do not share this ID with the user)
Current Date: ${context.currentDateTime}
Timezone: ${context.timezone}
Team Name: ${context.teamName}
Team Description: ${context.teamDescription}
Base Currency: ${context.baseCurrency}
Locale: ${context.locale}

Important: Use the current date/time above for time-sensitive operations.`;
}

export const COMMON_AGENT_RULES = `<behavior-rules>
- Do not make up data, always use tools to retrieve information
- Mutations (create, update, delete) should be done via tool calls only
- Do not make up data - if unsure, use tools to retrieve information
- Never send plain UUIDs to the user
- When using tools, ensure parameters named ID correspond to actual IDs from the system using tools
- Always write in the team's preferred language as indicated by the locale
- Use parallel tool calls when possible
</behavior-rules>`;

export interface AppContext {
	userId: string;
	agentId: string;
	behalfUserId: string;
	fullName: string;
	teamName: string;
	teamDescription: string;
	locale: string;
	currentDateTime: string;
	country?: string;
	city?: string;
	region?: string;
	timezone: string;
	chatId: string;
	teamId: string;
	teamSlug: string;
	artifactSupport?: boolean;
	additionalContext: string;
	integrationType: "web" | "slack" | "whatsapp" | "mattermost";
	documentsOfInterest?: Array<{
		id: string;
		name: string;
	}>;
	writer?: UIMessageStreamWriter<UIChatMessage>;
	// Allow additional properties to satisfy Record<string, unknown> constraint
	[key: string]: unknown;
}

export function buildAppContext(
	context: ChatUserContext & {
		artifactSupport?: boolean;
		behalfUserId?: string;
		agentId: string;
		documentsOfInterest?: Array<{
			id: string;
			name: string;
		}>;
		integrationType: "web" | "slack" | "whatsapp" | "mattermost";
	},
	chatId: string,
): AppContext {
	return {
		userId: context.userId,
		agentId: context.agentId,
		behalfUserId: context.behalfUserId || context.userId,
		fullName: context.fullName ?? "",
		teamName: context.teamName ?? "",
		teamDescription: context.teamDescription ?? "",
		country: context.country ?? undefined,
		city: context.city ?? undefined,
		region: context.region ?? undefined,
		chatId,
		locale: context.locale ?? "en-US",
		currentDateTime: new Date().toISOString(),
		timezone:
			context.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
		teamId: context.teamId,
		teamSlug: context.teamSlug,
		artifactSupport: context.artifactSupport ?? false,
		additionalContext: context.additionalContext ?? "",
		integrationType: context.integrationType,
		documentsOfInterest: context.documentsOfInterest ?? [],
	};
}

// biome-ignore lint/suspicious/noExplicitAny: Tool types no needed here
export const repairToolCall: ToolCallRepairFunction<any> = async ({
	inputSchema,
	error,
	toolCall,
	tools,
}) => {
	if (NoSuchToolError.isInstance(error)) {
		return null; // No such tool - cannot repair
	}

	const tool = tools[toolCall.toolName];

	if (!tool) {
		return null; // Tool not found - cannot repair
	}

	if (!InvalidToolInputError.isInstance(error)) {
		return null; // Not an input error - cannot repair
	}

	const output = await generateText({
		model: "openai/gpt-4o-mini",
		output: Output.object({
			schema: tool.inputSchema,
		}),
		prompt: [
			`The model tried to call the tool "${toolCall.toolName}"` +
				" with the following inputs:",
			JSON.stringify(toolCall.input),
			"The tool accepts the following schema:",
			JSON.stringify(inputSchema(toolCall)),
			"Please fix the inputs.",
		].join("\n"),
	});

	return {
		...toolCall,
		input: JSON.stringify(output.output),
	};
};
