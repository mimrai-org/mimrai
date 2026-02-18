import type { UIChatMessage } from "@api/ai/types";
import { generateTitle } from "@api/ai/utils/generate-title";
import { summarizeChat } from "@api/ai/utils/summarize-chat";
import {
	getChatById,
	saveChat,
	saveChatMessage,
} from "@mimir/db/queries/chats";
import {
	convertToModelMessages,
	createUIMessageStream,
	type GatewayModelId,
	gateway,
	type ModelMessage,
	smoothStream,
	ToolLoopAgent,
	type ToolLoopAgentSettings,
	type UIMessage,
} from "ai";
import { type AppContext, repairToolCall } from "./shared";

export interface AgentConfig extends ToolLoopAgentSettings {
	name: string;
	description: string;
	summarizeHistory?: boolean;
	generateTitle?: boolean;
	buildInstructions?: (ctx: AppContext) => string;
}

export interface AgentGenerateParams {
	message: UIMessage;
	context: AppContext;
	onFinish?: (params: { responseMessage: UIMessage }) => void | Promise<void>;
}

export const createAgent = (config: AgentConfig) => {
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

	const prepareAgent = async ({ message, context }: AgentGenerateParams) => {
		const previousMessages: UIChatMessage[] = [];
		const chatId = context.chatId;

		let chat = await getChatById(chatId);
		if (!chat) {
			await saveChat({
				chatId: chatId,
				teamId: context.teamId,
				userId: context.userId,
			});
			chat = await getChatById(chatId);
		}

		previousMessages.push(...((chat?.messages || []) as UIChatMessage[]));
		const slicedMessages = previousMessages.slice(-20);

		const uiMessages = [...slicedMessages, message];

		return { messages: uiMessages as UIChatMessage[], chat };
	};

	const buildAgent = (params: AgentGenerateParams) => {
		const ctx = params.context;
		const instructions = config.buildInstructions?.(ctx) ?? "";

		const agent = new ToolLoopAgent({
			...config,
			experimental_context: params.context,
			experimental_repairToolCall: repairToolCall,
			instructions: instructions,
		});

		return agent;
	};

	return {
		async stream(params: AgentGenerateParams) {
			const { messages, chat } = await prepareAgent(params);

			return createUIMessageStream({
				originalMessages: messages,
				onFinish: async ({ responseMessage }) => {
					await saveConversation(
						params.message,
						params.context,
						responseMessage,
					).catch((err) => {
						console.error("Error saving conversation:", err);
					});
					params.onFinish?.({ responseMessage });
				},
				onError: (error) => {
					console.error("Agent stream error:", error);
					const errorMessage =
						error instanceof Error ? error.message : String(error);
					return errorMessage;
				},
				execute: async ({ writer }) => {
					const agent = buildAgent({
						...params,
						context: {
							...params.context,
							writer: writer,
						},
					});

					if (config.summarizeHistory) {
						const summary = await summarizeChat({
							chatId: params.context.chatId,
							lastSummaryAt: chat.lastSummaryAt || new Date(0).toISOString(),
							lastSummary: chat.summary,
						});
						await saveChat({
							chatId: params.context.chatId,
							summary: summary,
							userId: params.context.userId,
						});
					}

					if (config.generateTitle) {
						const title = await generateTitle({
							messages: messages,
							currentTitle: chat.title,
						});

						if (title) {
							console.log("Generated title:", title);
							await saveChat({
								chatId: params.context.chatId,
								title: title,
								userId: params.context.userId,
							});
							writer.write({
								type: "data-title",
								data: {
									title: title,
								},
							});
						}
					}

					const modelMessages = await convertToModelMessages(messages);

					const seenToolCallIds = new Set<string>();
					const seenToolResultsIds = new Set<string>();
					const repairedMessages = modelMessages.map((msg) => {
						if (typeof msg.content === "string") {
							return msg;
						}

						return {
							...msg,
							content: msg.content
								.map((content) => {
									if (typeof content === "string") {
										return content;
									}

									if (content.type === "tool-call") {
										if (seenToolCallIds.has(content.toolCallId)) {
											return null; // Skip duplicate tool call
										}

										seenToolCallIds.add(content.toolCallId);
										return content;
									}

									if (content.type === "tool-result") {
										if (seenToolResultsIds.has(content.toolCallId)) {
											return null; // Skip duplicate tool result
										}

										seenToolResultsIds.add(content.toolCallId);
										return content;
									}

									return content;
								})
								.filter((c) => c !== null), // Remove nulls
						} as ModelMessage;
					});

					const stream = await agent.stream({
						messages: repairedMessages,
						experimental_transform: smoothStream({ chunking: "word" }),
					});
					writer.merge(
						stream.toUIMessageStream({
							sendReasoning: true,
							messageMetadata({ part }) {
								return {
									agentId: params.context.agentId,
								};
							},
						}),
					);
				},
			});
		},
		async generate(params: AgentGenerateParams & { timeoutMs?: number }) {
			const timeout = params.timeoutMs ?? 10 * 60 * 1000; // 10 minutes default

			return new Promise<UIChatMessage>((resolve, reject) => {
				const timer = setTimeout(() => {
					reject(new Error(`Agent generate timed out after ${timeout}ms`));
				}, timeout);

				(async () => {
					let resolved = false;

					const stream = await this.stream({
						...params,
						onFinish: ({ responseMessage }) => {
							resolved = true;
							clearTimeout(timer);
							params.onFinish?.({ responseMessage });
							resolve(responseMessage as UIChatMessage);
						},
					});

					const reader = stream.getReader();
					try {
						while (true) {
							if (resolved) break;
							const { done } = await reader.read();
							if (done) break;
						}
					} finally {
						reader.releaseLock();
					}

					// Stream ended without onFinish firing
					if (!resolved) {
						clearTimeout(timer);
						reject(
							new Error(
								"Agent stream ended without producing a response message.",
							),
						);
					}
				})().catch((err) => {
					clearTimeout(timer);
					reject(err);
				});
			});
		},
	};
};
