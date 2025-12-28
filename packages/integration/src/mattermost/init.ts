import { randomUUID } from "node:crypto";
import { buildAppContext } from "@api/ai/agents/config/shared";
import { triageAgent } from "@api/ai/agents/triage";
import type { UIChatMessage } from "@api/ai/types";
import { getUserContext } from "@api/ai/utils/get-user-context";
import { createAdminClient } from "@api/lib/supabase";
import { Client4, type WebSocketMessage } from "@mattermost/client";
import type { UserProfile } from "@mattermost/types/users";
import { checkPlanFeatures } from "@mimir/billing";
import { integrationsCache } from "@mimir/cache/integrations-cache";
import { db } from "@mimir/db/client";
import { getChatById, saveChatMessage } from "@mimir/db/queries/chats";
import {
	getIntegrationByType,
	getLinkedUserByExternalId,
} from "@mimir/db/queries/integrations";
import { integrations } from "@mimir/db/schema";
import { trackMessage } from "@mimir/events/server";
import { getApiUrl } from "@mimir/utils/envs";
import type { UIMessage } from "ai";
import { fetch } from "bun";
import { eq } from "drizzle-orm";
import WebSocket from "ws";
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

export const safeMessage = (text: string, botUsername: string) => {
	const safeLength = text.length > 3000 ? `${text.slice(0, 3000)}...` : text;
	// remove bot mentions
	const safeText = safeLength
		.replace(new RegExp(`@${botUsername}`, "g"), "")
		.trim();
	return safeText;
};

const runnerId = randomUUID();
const wsClients: Record<string, WebSocket> = {};

export const initMattermostSingle = async (
	integration: typeof integrations.$inferSelect,
) => {
	const config = integration.config as {
		url: string;
		token: string;
	};

	// listen for start requests
	integrationsCache.listenStart(async (integrationId) => {
		if (integrationId === integration.id) {
			await initMattermostSingle(integration);
		}
	});

	// Acquire a runner lock
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

	// test the connection before locking
	const client = new Client4();
	client.setUrl(config.url);
	client.setToken(config.token);
	let me: UserProfile;

	try {
		me = await client.getMe();
	} catch (error) {
		console.error(
			`Failed to connect to Mattermost for integration ${integration.id}:`,
			(error as { message?: string }).message,
		);
		return;
	}

	const ttl = process.env.NODE_ENV === "development" ? 1_000 : 15_000;
	const { acquired, release } = await integrationsCache.acquireLock(
		integration.id,
		ttl,
	);

	if (!acquired) {
		console.log(
			`Mattermost integration ${integration.id} is already running elsewhere.`,
		);
		return;
	}

	process.on("SIGINT", async () => {
		await unregister();
		await release();
		await integrationsCache.requestStart(integration.id);
		process.exit();
	});

	try {
		console.log("Logged in as:", me.username, me.id);

		const initializeSocket = async () => {
			delete wsClients[integration.id];
			wsClients[integration.id] = new WebSocket(
				`${config.url.replace("http", "ws")}/api/v4/websocket`,
				{
					headers: {
						Authorization: `Bearer ${config.token}`,
					},
				},
			);
			const wsClient = wsClients[integration.id]!;

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

						const threadId = typedData.channel_name.includes(
							typedData.post.root_id,
						)
							? typedData.post.id
							: typedData.post.root_id;
						const isDirect =
							typedData.channel_type === "D" &&
							typedData.channel_name.includes(me.id);
						const isMentioned = typedData.mentions.includes(me.id);
						const senderId = typedData.post.user_id;
						const senderName = typedData.sender_name;

						//temporary only response if its me
						if (
							process.env.NODE_ENV === "development" &&
							senderName !== "@alain"
						)
							return;

						if (isDirect || isMentioned) {
							const associetedUser = await getLinkedUserByExternalId({
								externalUserId: senderId,
								integrationId: integration.id,
							});

							if (!associetedUser) {
								// associate the user

								// send the association linking message
								const url = new URL(
									`${getApiUrl()}/api/integrations/associate`,
								);
								url.searchParams.append("integrationId", integration.id);
								url.searchParams.append("integrationType", "mattermost");
								url.searchParams.append("externalUserId", senderId);
								url.searchParams.append(
									"externalUserName",
									senderName || "unknown",
								);

								await client.createPost({
									channel_id: typedData.post.channel_id,
									message: `To link your Mattermost account with Mimir, please click the following link: ${url.toString()}`,
								});
							} else {
								// handle the message

								if (isMentioned) {
									const canAccess = await checkPlanFeatures(
										integration.teamId,
										["ai"],
									);
									if (!canAccess) {
										await client.createPost({
											channel_id: typedData.post.channel_id,
											message:
												"Your team plan does not include AI features. Please upgrade your plan to use this feature.",
											root_id: threadId ?? typedData.post.id,
										});
										return;
									}

									const [userContext, chat] = await Promise.all([
										getUserContext({
											userId: associetedUser.userId,
											teamId: integration.teamId,
										}),
										getChatById(threadId, integration.teamId),
									]);
									const previousMessages = chat ? chat.messages : [];
									const userMessage: UIChatMessage = {
										id: typedData.post.id,
										role: "user",
										parts: [
											{
												type: "text",
												text: safeMessage(typedData.post.message, me.username),
											},
										],
									};
									previousMessages.push(userMessage);

									const unsavedMessages: {
										message: UIChatMessage;
										createdAt: string;
									}[] = [];

									const channel = await client.getChannel(
										typedData.post.channel_id,
									);

									const teams = await client.getMyTeams();
									const team =
										teams.find((t) => t.id === channel.team_id) ?? teams[0];
									const teamName = team?.name || "default";

									const systemPrompt = `If you create a task add the next link to the task description to allow easy access to the context, append at the end of the description and use markdown format:
									CONTEXT LINK: [Context Link](${
										config.url
									}/${teamName}/pl/${threadId})
									`;

									if (threadId) {
										const posts = await client.getPostThread(threadId, true);
										const postsArray = Object.values(posts.posts);

										// Sort posts by creation time
										postsArray.sort((a, b) => a.create_at - b.create_at);

										for (const post of postsArray) {
											if (
												previousMessages.find((m) => {
													return m.id === post.id;
												})
											) {
												continue;
											}

											const files = post.metadata.files;

											const message: UIChatMessage = {
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
															Authorization: `Bearer ${config.token}`,
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
													text: safeMessage(post.message, me.username),
													type: "text",
												});
											}

											if (message.parts.length > 0) {
												unsavedMessages.push({
													message,
													createdAt: new Date(post.create_at).toISOString(),
												});
											}
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
											if (
												previousMessages.find((m) => {
													return m.id === post.id;
												})
											) {
												continue;
											}
											const files = post.metadata.files;

											const message: UIChatMessage = {
												id: post.id,
												role: post.user_id === me.id ? "assistant" : "user",
												parts: [],
											};
											if (files && files.length > 0) {
												for (const file of files) {
													const fileRemoteUrl = client.getFileUrl(
														file.id,
														file.create_at,
													);
													const fileResponse = await fetch(fileRemoteUrl, {
														headers: {
															Authorization: `Bearer ${config.token}`,
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

											if (post.message.split(" ").length < 100) {
												// Simple heuristic: include messages that are not too long
												message.parts.push({
													text: safeMessage(post.message, me.username),
													type: "text",
												});
											}

											if (message.parts.length > 0) {
												unsavedMessages.push({
													message,
													createdAt: new Date(post.create_at).toISOString(),
												});
											}
										}
									}

									// Save unsaved messages to the database
									const savePromises: Promise<unknown>[] = [];
									for (const { message, createdAt } of unsavedMessages) {
										savePromises.push(
											saveChatMessage({
												chatId: threadId,
												userId: associetedUser.userId,
												message,
												role: message.role,
												createdAt: new Date(createdAt).toISOString(),
											}),
										);
									}
									await Promise.all(savePromises);

									console.log(`genering response for thread ${threadId}`);
									const thinkingPost = await client.createPost({
										channel_id: typedData.post.channel_id,
										message: "_Thinking..._",
										root_id: threadId ?? typedData.post.id,
									});

									const appContext = buildAppContext(
										{ ...userContext, integrationType: "mattermost" },
										threadId,
									);

									const systemMessage: UIChatMessage = await new Promise(
										(resolve, reject) => {
											const messageStream = triageAgent.toUIMessageStream({
												message: userMessage,
												strategy: "auto",
												maxRounds: 5,
												maxSteps: 20,
												context: appContext,
												sendFinish: true,
												onFinish: ({ responseMessage }) => {
													resolve(responseMessage as UIChatMessage);
												},
											});

											// read the stream to completion to avoid memory leaks
											(async () => {
												try {
													await messageStream.json();
												} catch (e) {
													reject(e);
												}
											})();
										},
									);

									const body =
										systemMessage.parts[systemMessage.parts.length - 1]
											?.type === "text"
											? (
													systemMessage.parts[
														systemMessage.parts.length - 1
													] as UIMessage["parts"][number] & {
														type: "text";
													}
												).text
											: "Sorry, I could not process your message.";

									log(
										integration.id,
										"info",
										`Response: ${body.slice(0, 80)}...`,
										{
											message: body,
										},
									);

									trackMessage({
										userId: associetedUser.userId,
										teamId: integration.teamId,
										teamName: team?.name,
										source: "mattermost",
									});

									// Post the response back to the thread
									await client.updatePost({
										...thinkingPost,
										message: body,
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

			return wsClients[integration.id]!;
		};

		let pingClient = await initializeSocket();
		setInterval(async () => {
			if (pingClient.readyState === WebSocket.OPEN) {
				pingClient.ping();
			} else {
				// socket is not open, try to reconnect
				pingClient = await initializeSocket();
				console.log(
					`Integration ${integration.id} reconnected to Mattermost WebSocket.`,
				);
			}
		}, 20_000);
	} catch (error) {
		const typedError = error as { message?: string };
		console.error(
			"Error initializing Mattermost integration:",
			integration.id,
			typedError.message,
		);
	}

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
