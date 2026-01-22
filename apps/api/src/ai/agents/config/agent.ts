import type { UIChatMessage } from "@api/ai/types";
import {
	getChatById,
	saveChat,
	saveChatMessage,
} from "@mimir/db/queries/chats";
import {
	type AsyncIterableStream,
	createAgentUIStream,
	createAgentUIStreamResponse,
	type InferUIMessageChunk,
	type InferUITools,
	ToolLoopAgent,
	type ToolLoopAgentSettings,
	type UIMessage,
} from "ai";
import type { AppContext } from "./shared";

export interface AgentConfig extends ToolLoopAgentSettings {
	name: string;
	description: string;
	buildInstructions?: (ctx: AppContext) => string;
}

export interface AgentGenerateParams {
	message: UIMessage;
	context: AppContext;
	onFinish?: (params: { responseMessage: UIMessage }) => void | Promise<void>;
}

export interface Agent {
	generate(params: AgentGenerateParams): Promise<UIChatMessage>;
	toUIMessageStreamResponse(params: AgentGenerateParams): Promise<Response>;
	toUIMessageStream(
		params: AgentGenerateParams,
	): Promise<
		AsyncIterableStream<
			InferUIMessageChunk<UIMessage<unknown, never, InferUITools<{}>>>
		>
	>;
}

export const createAgent = (config: AgentConfig): Agent => {
	const saveConversation = async (
		message: UIMessage | UIChatMessage,
		context: AppContext,
		agentResponse: UIMessage | UIChatMessage,
	) => {
		const chatId = context.chatId;
		const userMessage = message as UIChatMessage;
		const assistantMessage = agentResponse as UIChatMessage;

		const savePromises = [];

		// Save the message to the chat
		savePromises.push(
			saveChatMessage({
				chatId: chatId,
				teamId: context.teamId,
				userId: context.userId,
				message: assistantMessage,
				role: "assistant",
			}),
		);

		// Save the user message as well
		savePromises.push(
			saveChatMessage({
				chatId: chatId,
				teamId: context.teamId,
				userId: context.userId,
				message: userMessage,
				role: "user",
			}),
		);

		await Promise.all(savePromises);
	};

	const loadHistory = async ({
		message,
		context,
	}: AgentGenerateParams): Promise<{
		messages: UIChatMessage[];
	}> => {
		const previousMessages: UIChatMessage[] = [];
		const chatId = context.chatId;

		const chat = await getChatById(chatId);
		if (!chat) {
			await saveChat({
				chatId: chatId,
				teamId: context.teamId,
				userId: context.userId,
			});
		}

		previousMessages.push(...((chat?.messages || []) as UIChatMessage[]));
		const slicedMessages = previousMessages.slice(-20);

		const uiMessages = [...slicedMessages, message];

		return { messages: uiMessages as UIChatMessage[] };
	};

	const buildAgent = (params: AgentGenerateParams) => {
		const ctx = params.context;
		const instructions = config.buildInstructions?.(ctx) ?? "";

		const agent = new ToolLoopAgent({
			...config,
			experimental_context: params.context,
			instructions: instructions,
		});

		return agent;
	};

	return {
		toUIMessageStreamResponse: async (params: AgentGenerateParams) => {
			const agent = buildAgent(params);
			const { messages: uiMessages } = await loadHistory(params);

			return createAgentUIStreamResponse({
				agent,
				uiMessages,
				onError: (error) => {
					console.error("Agent stream error:", error);
					const message =
						error instanceof Error ? error.message : String(error);
					return message;
				},
				onFinish: async ({ responseMessage }) => {
					params.onFinish?.({ responseMessage });
					await saveConversation(
						params.message,
						params.context,
						responseMessage,
					);
				},
			});
		},
		async toUIMessageStream(params: AgentGenerateParams) {
			const agent = buildAgent(params);
			const { messages: uiMessages } = await loadHistory(params);

			return createAgentUIStream({
				agent,
				uiMessages,
				onError: (error) => {
					console.error("Agent stream error:", error);
					const message =
						error instanceof Error ? error.message : String(error);
					return message;
				},
				onFinish: async ({ responseMessage }) => {
					params.onFinish?.({ responseMessage });
					await saveConversation(
						params.message,
						params.context,
						responseMessage,
					);
				},
			});
		},
		async generate(params: AgentGenerateParams) {
			return new Promise<UIChatMessage>((resolve, reject) => {
				(async () => {
					const stream = await this.toUIMessageStream({
						...params,
						onFinish: ({ responseMessage }) => {
							params.onFinish?.({ responseMessage });
							resolve(responseMessage as UIChatMessage);
						},
					});

					// consume the stream to get the final response
					for await (const chunk of stream) {
						// no-op
					}
				})();
			});
		},
	};
};
