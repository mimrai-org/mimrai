import { buildAppContext } from "@api/ai/agents/config/shared";
import { triageAgent } from "@api/ai/agents/triage";
import type { UIChatMessage } from "@api/ai/types";
import { getUserContext } from "@api/ai/utils/get-user-context";
import { db } from "@mimir/db/client";
import { getChatById, saveChatMessage } from "@mimir/db/queries/chats";
import { createTaskComment } from "@mimir/db/queries/tasks";
import { getSystemUser } from "@mimir/db/queries/users";
import { activities, tasks } from "@mimir/db/schema";
import type { UIMessage } from "ai";
import { and, eq } from "drizzle-orm";

export const handleTaskComment = async ({
	taskId,
	teamId,
	userId,
	commentId,
	comment,
}: {
	taskId: string;
	teamId: string;
	userId: string;
	commentId: string;
	comment: string;
}) => {
	const systemUser = await getSystemUser();

	if (!systemUser) {
		throw new Error("System user not found");
	}

	// check if the comment has a mention of the system user
	if (!comment.includes(`@${systemUser.name}`)) {
		return;
	}

	const chatId = `task-${taskId}-thread`;

	const [userContext, chat] = await Promise.all([
		getUserContext({
			userId: userId,
			teamId: teamId,
		}),
		getChatById(chatId, teamId),
	]);
	const previousMessages = chat ? chat.messages : [];
	const allMessages = [...previousMessages];
	const userMessage: UIChatMessage = {
		id: commentId,
		role: "user",
		parts: [
			{
				type: "text",
				text: comment,
			},
		],
	};

	const [task] = await db
		.select()
		.from(tasks)
		.where(and(eq(tasks.id, taskId), eq(tasks.teamId, teamId)))
		.limit(1);

	if (!task) {
		throw new Error("Task not found");
	}

	const unsavedMessages: {
		message: UIChatMessage;
		createdAt: string;
	}[] = [];

	const comments = await db
		.select()
		.from(activities)
		.where(
			and(
				eq(activities.groupId, taskId),
				eq(activities.teamId, teamId),
				eq(activities.type, "task_comment"),
			),
		)
		.limit(20);

	const replyComments = await db
		.select()
		.from(activities)
		.where(
			and(
				eq(activities.groupId, commentId),
				eq(activities.teamId, teamId),
				eq(activities.type, "task_comment"),
			),
		)
		.limit(10);

	const allComments = [...comments, ...replyComments];

	for (const oldComment of allComments) {
		if (allMessages.find((m) => m.id === oldComment.id)) {
			continue;
		}

		if (!oldComment.metadata?.comment) {
			continue;
		}

		const message: UIChatMessage = {
			id: oldComment.id,
			role: "user",
			parts: [{ type: "text", text: oldComment.metadata?.comment }],
		};

		allMessages.push(message);
		unsavedMessages.push({
			message,
			createdAt: oldComment.createdAt!,
		});
	}

	unsavedMessages.push({
		message: userMessage,
		createdAt: new Date().toISOString(),
	});
	allMessages.push(userMessage);

	await Promise.all(
		unsavedMessages.map(({ message, createdAt }) =>
			saveChatMessage({
				chatId: chatId,
				userId: userId,
				message: message,
				role: "user",
				createdAt: createdAt,
			}),
		),
	);

	const appContext = buildAppContext(
		{
			...userContext,
			integrationType: "whatsapp",
			additionalContext: `
				<IMPORTANT>
					This message was posted as a comment on a task, THIS IS NOT A CHAT, your response will be posted as a comment for the task, you have to following context to answer appropriately.
					<rules>
						- Do not mention anything that you are working with this task, the user already knows that.
						- Do not mention the task title or description unless specifically asked.
						- Keep your answer focused on the task at hand.
						- Provide clear and concise information relevant to the task.
						- If the comment is a question, provide a direct answer based on the task information.
						- Do not include any greetings or sign-offs in your response.
					</rules>
					<task-context>
						id: ${taskId}
						title: ${task.title}
						description: ${task.description ?? "No description"}
					</task-context>
				</IMPORTANT>
			`,
		},
		chatId,
	);

	const text: UIChatMessage = await new Promise((resolve, reject) => {
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
	});

	const body =
		text.parts[text.parts.length - 1]?.type === "text"
			? (
					text.parts[text.parts.length - 1] as UIMessage["parts"][number] & {
						type: "text";
					}
				).text
			: "Sorry, I could not process your message.";

	await createTaskComment({
		taskId,
		comment: body,
		replyTo: commentId,
		userId: systemUser.id,
		teamId,
	});
};
