const window = globalThis as unknown as { WebSocket?: typeof WebSocket };

import { Client4, type WebSocketMessage } from "@mattermost/client";
import { integrationsCache } from "@mimir/cache/integrations-cache";
import {
	convertToModelMessages,
	generateText,
	stepCountIs,
	type UIMessage,
} from "ai";
import { fetch } from "bun";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import WebSocket from "ws";
import { setContext } from "@/ai/context";
import { generateSystemPrompt } from "@/ai/generate-system-prompt";
import { createToolRegistry } from "@/ai/tool-types";
import { getUserContext } from "@/ai/utils/get-user-context";
import { db } from "@/db";
import { integrations, integrationUserLink } from "@/db/schema/schemas";
import { createAdminClient } from "@/lib/supabase";
import { shouldForceStop } from "@/utils/streaming-utils";
import { log } from "../logger";

if (!globalThis.WebSocket) {
	// @ts-expect-error
	globalThis.WebSocket = WebSocket;
}

export const initMattermost = async () => {
	const data = await db
		.select()
		.from(integrations)
		.where(eq(integrations.type, "mattermost"));

	for (const integration of data) {
		// Initialize Mattermost integration with the config
		await initMattermostSingle(integration);
	}
};

export const safeMessage = (text: string) => {
	const safeLength = text.length > 3000 ? `${text.slice(0, 3000)}...` : text;
	const safeText = safeLength.replace(/@/g, "@\u200b"); // prevent mentions
	return safeText;
};

const runnerId = randomUUID();
const wsClients: Record<string, WebSocket> = {};

export const initMattermostSingle = async (
	integration: typeof integrations.$inferSelect,
) => {
	// listen for start requests
	integrationsCache.listenStart(async (integrationId) => {
		if (integrationId === integration.id) {
			await initMattermostSingle(integration);
		}
	});

	// Check if already running and it's not us
	const isRunning = await integrationsCache.isRunning(integration.id);
	if (isRunning) {
		console.log(
			`Mattermost integration ${integration.id} already initialized, skipping.`,
		);
		return;
	}

	const unregister = await integrationsCache.registerRunner(
		integration.id,
		async (event) => {
			if (event.type === "stop") {
				const wsClient = wsClients[integration.id];
				if (wsClient) {
					wsClient.close();
					delete wsClients[integration.id];
				}
				console.log(`Mattermost integration ${integration.id} stopped.`);
				return;
			}

			if (event.type === "restart") {
				const wsClient = wsClients[integration.id];
				if (!wsClient) return;

				wsClient.close();
				delete wsClients[integration.id];

				await unregister();
				console.log(`Mattermost integration ${integration.id} restarting...`);
				await initMattermostSingle({
					...integration,
					config:
						(event.config as typeof integration.config) ?? integration.config,
				});
				return;
			}
		},
	);

	process.on("SIGINT", async () => {
		await unregister();
		await integrationsCache.requestStart(integration.id);
		process.exit();
	});

	console.log(
		"Initializing Mattermost integration:",
		integration.id,
		"runnerId:",
		runnerId,
	);
	const client = new Client4();
	client.setUrl(integration.config.url);
	client.setToken(integration.config.token);
	const me = await client.getMe();

	wsClients[integration.id] = new WebSocket(
		`${integration.config.url.replace("http", "ws")}/api/v4/websocket`,
		{
			headers: {
				Authorization: `Bearer ${integration.config.token}`,
			},
		},
	);
	const wsClient = wsClients[integration.id];

	wsClient.on("message", async (data) => {
		const parsedData = JSON.parse(data.toString()) as WebSocketMessage;
		switch (parsedData.event) {
			case "posted": {
				const typedData = {
					...parsedData.data,
					mentions: JSON.parse(parsedData.data.mentions ?? "[]"),
					post: JSON.parse(parsedData.data.post),
				} as {
					channel_display_name: string;
					channel_name: string;
					channel_type: "D";
					sender_name: string;
					mentions: string[];
					post: {
						id: string;
						create_at: number;
						update_at: number;
						edit_at: number;
						delete_at: number;
						is_pinned: boolean;
						user_id: string;
						channel_id: string;
						root_id: string;
						original_id: string;
						message: string;
						type: string;
						props: Record<string, unknown>;
						hashtags: string;
					};
				};

				// Check if the post is from a bot to avoid loops
				if (typedData.post.user_id === me.id) return;

				console.log("New post event:", typedData);

				const threadId = typedData.post.root_id;
				const isDirect =
					typedData.channel_type === "D" &&
					typedData.channel_name.includes(me.id);
				const isMentioned = typedData.mentions.includes(me.id);
				const senderId = typedData.post.user_id;
				const senderName = typedData.sender_name;

				//temporary only response if its me
				if (senderName !== "@alain") return;

				if (isDirect || isMentioned) {
					const [associetedUser] = await db
						.select()
						.from(integrationUserLink)
						.where(eq(integrationUserLink.externalUserId, senderId))
						.limit(1);

					if (!associetedUser) {
						// associate the user

						// send the association linking message
						const url = `${process.env.API_URL}/api/integrations/mattermost/associate?integrationId=${integration.id}&mattermostUserId=${senderId}&mattermostUserName=${encodeURIComponent(
							senderName,
						)}`;
						await client.createPost({
							channel_id: typedData.post.channel_id,
							message: `To link your Mattermost account with Mimir, please click the following link: ${url}`,
						});
					} else {
						// handle the message

						// get user context
						const userContext = await getUserContext({
							userId: associetedUser.userId,
							teamId: integration.teamId,
						});

						const systemPrompt = generateSystemPrompt(userContext);

						const relevantMessages: UIMessage[] = [];
						if (threadId) {
							const posts = await client.getPostThread(threadId, true);
							const postsArray = Object.values(posts.posts);

							// Sort posts by creation time
							postsArray.sort((a, b) => a.create_at - b.create_at);

							for (const post of postsArray) {
								const files = post.metadata.files;

								const message: UIMessage = {
									id: post.id,
									role: post.user_id === me.id ? "assistant" : "user",
									parts: [],
								};

								// Attach files if any
								if (files && files.length > 0) {
									for (const file of files) {
										const fileRemoteUrl = client.getFileUrl(
											file.id,
											file.create_at,
										);
										const fileResponse = await fetch(fileRemoteUrl, {
											headers: {
												Authorization: `Bearer ${integration.config.token}`,
											},
										});
										const fileBlob = await fileResponse.blob();

										const supabase = await createAdminClient();
										const storageFile = await supabase.storage
											.from("vault")
											.upload(
												`${associetedUser.userId}/${file.id}-${file.name}`,
												fileBlob,
												{
													upsert: true,
												},
											);
										const fullPath = `${process.env.SUPABASE_URL}/storage/v1/object/public/${storageFile.data?.fullPath}`;

										console.log("Attaching file to message:", fullPath);

										if (fullPath) {
											message.parts.push({
												type: "text",
												text: `Save the next url as an attachment: ${fullPath}`,
											});
										}
									}
								}

								// Simple heuristic: include messages that are not too long
								if (post.message.split(" ").length < 100) {
									message.parts.push({
										text: safeMessage(post.message),
										type: "text",
									});
								}

								if (message.parts.length > 0) relevantMessages.push(message);
							}
						} else {
							const latestPostInChannel = await client.getPosts(
								typedData.post.channel_id,
								0,
								20,
							);
							const postArray = Object.values(latestPostInChannel.posts);
							// Sort posts by creation time
							postArray.sort((a, b) => a.create_at - b.create_at);

							for (const post of postArray) {
								// Simple heuristic: include messages that are not too long
								if (post.message.split(" ").length < 100) {
									relevantMessages.push({
										id: post.id,
										role: post.user_id === me.id ? "assistant" : "user",
										parts: [
											{
												text: safeMessage(post.message),
												type: "text",
											},
										],
									});
								}
							}
						}

						if (isMentioned) {
							// fetch thread messages and populate relevantMessages

							setContext({
								db,
								user: userContext,
								//@ts-expect-error
								writer: undefined,
								artifactSupport: false,
							});

							console.log(`genering response for thread ${threadId}`);

							const thinkingPost = await client.createPost({
								channel_id: typedData.post.channel_id,
								message: "_Generating response..._",
								root_id: threadId ?? typedData.post.id,
							});

							const text = await generateText({
								model: "openai/gpt-4o",
								system: systemPrompt,
								messages: convertToModelMessages(relevantMessages),
								temperature: 0.7,
								tools: createToolRegistry(),
								stopWhen: (step) => {
									// Stop if we've reached 10 steps (original condition)
									if (stepCountIs(10)(step)) {
										return true;
									}

									// Force stop if any tool has completed its full streaming response
									return shouldForceStop(step);
								},
							});

							log(
								integration.id,
								"info",
								`Response: ${text.text.slice(0, 80)}...`,
								{
									outputTokens: text.usage.outputTokens,
									inputTokens: text.usage.outputTokens,
									message: text.text,
								},
							);

							// Post the response back to the thread
							await client.updatePost({
								...thinkingPost,
								message: text.text,
							});
						}
					}
				}

				break;
			}
			// Handle other events as needed
			default:
				break;
		}
	});

	// wsClient.addMessageListener((message) => {
	// 	switch (message.event) {
	// 		case "posted":
	// 			console.log("New message posted:", message.data);
	// 			break;
	// 		// Handle other events as needed
	// 		default:
	// 			break;
	// 	}
	// });
};
