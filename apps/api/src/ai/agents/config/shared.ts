import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Agent, type AgentConfig } from "@ai-sdk-tools/agents";
import type { ChatUserContext } from "@api/ai/chat-cache";
import {
	type ContextItem,
	formatLLMContextItems,
} from "@api/ai/utils/format-context-items";
import { db } from "@db/index";
import { DrizzleProvider } from "./drizzle-provider";
import { memoryTemplate } from "./memory-template";
import { suggestionsInstructions } from "./suggestions-instructions";
import { titleInstructions } from "./title-instructions";

export function formatContextForLLM(context: AppContext): string {
	return `<team-info>
<current-date>${context.currentDateTime}</current-date>
<timezone>${context.timezone}</timezone>
<team-name>${context.teamName}</team-name>
<team-description>${context.teamDescription}</team-description>
<base-currency>${context.baseCurrency}</base-currency>
<locale>${context.locale}</locale>
</team-info>

<channel-instructions>
VERT IMPORTANT: You are communicating with the user via ${context.integrationType}. Respect the limitations and conventions of this platform.

${
	context.integrationType === "web"
		? `
	- When presenting repeated structured data (lists of items, multiple entries, time series), always use markdown tables
	- Tables make data scannable and easier to compare - use them for any data with 2+ rows
	`
		: context.integrationType === "whatsapp"
			? `
	- Keep your responses concise and to the point, as WhatsApp messages have character limits.
	- Truncate overly long responses. 2000 characters is the maximum length for a WhatsApp message. THIS IS VERY IMPORTANT otherwise the message will not be delivered.
	- Do no use markdown or any special formatting, as WhatsApp does not support it.
	- Use simple lists with dashes or numbers for multiple items.
	- Keep large list responses to a maximum of 5 items.
	- Share links as full URLs without hyperlinking or any special formatting.
	- Always send on top of the message the name of the team "${context.teamName}" to remind the user which team they are interacting with.
	`
			: ""
}

${context.additionalContext}
</channel-instructions>

${formatLLMContextItems(context.contextItems ?? [])}

Important: Use the current date/time above for time-sensitive operations. User-specific information is maintained in your working memory.`;
}

export const COMMON_AGENT_RULES = `<behavior-rules>
- Do not make up data, always use tools to retrieve information
- Call tools immediately without explanatory text
- Mutations (create, update, delete) should be done via tool calls only
- Do not make up data - if unsure, use tools to retrieve information
- Never send plain UUIDs to the user
- When using tools, ensure paramaters named ID correspond to actual IDs from the system using tools
- Always write in the team's preferred language as indicated by the locale
- Use parallel tool calls when possible
- Provide specific numbers and actionable insights
- Explain your reasoning
- Keep responses concise and relevant (under 500 words)
- Lead with the most important information first
</behavior-rules>`;

export interface AppContext {
	userId: string;
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
	contextItems?: Array<ContextItem>;
	// Allow additional properties to satisfy Record<string, unknown> constraint
	[key: string]: unknown;
}

export function buildAppContext(
	context: ChatUserContext & {
		artifactSupport?: boolean;
		contextItems?: Array<ContextItem>;
		integrationType: "web" | "slack" | "whatsapp" | "mattermost";
	},
	chatId: string,
): AppContext {
	return {
		userId: context.userId,
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
		contextItems: context.contextItems ?? [],
	};
}

// export const memoryProvider = new DrizzleProvider(db, {
// 	messagesTable: chatMessages,
// 	workingMemoryTable: chatWorkingMemory,
// 	chatsTable: chats,
// });

export const memoryProvider = new DrizzleProvider(db);

export const createAgent = (config: AgentConfig<AppContext>) => {
	return new Agent({
		...config,
		memory: {
			provider: memoryProvider,
			history: {
				enabled: true,
				limit: 10,
			},
			workingMemory: {
				enabled: false,
				template: memoryTemplate,
				scope: "user",
			},
			chats: {
				enabled: true,
				generateTitle: {
					model: "gpt-4.1-nano",
					instructions: titleInstructions,
				},
				generateSuggestions: {
					enabled: false,
					model: "gpt-4.1-nano",
					limit: 4,
					instructions: suggestionsInstructions,
				},
			},
		},
	});
};
