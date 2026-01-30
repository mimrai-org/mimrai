import { buildAppContext } from "@api/ai/agents/config/shared";
import {
	createTaskAssistantWithIntegrations,
	integrationTools,
	type TaskAssistantContext,
	taskAssistantAgent,
	type UserIntegrationInfo,
} from "@api/ai/agents/task-assistant";
import type { UIChatMessage } from "@api/ai/types";
import { getUserContext } from "@api/ai/utils/get-user-context";
import type { IntegrationName } from "@integration/registry";
import { db } from "@mimir/db/client";
import { getChatById, saveChatMessage } from "@mimir/db/queries/chats";
import { getLinkedUsers } from "@mimir/db/queries/integrations";
import { createTaskComment } from "@mimir/db/queries/tasks";
import { getSystemUser } from "@mimir/db/queries/users";
import {
	activities,
	labels,
	labelsOnTasks,
	milestones,
	projects,
	statuses,
	tasks,
	users,
} from "@mimir/db/schema";
import type { UIMessage } from "ai";
import { and, asc, eq, or } from "drizzle-orm";

/**
 * Get all integrations available to a user (where they have linked their account)
 */
const getUserAvailableIntegrations = async ({
	userId,
	teamId,
}: {
	userId: string;
	teamId: string;
}): Promise<UserIntegrationInfo[]> => {
	const linkedUsers = await getLinkedUsers({
		userId,
		teamId,
	});

	return linkedUsers.data.map((link) => ({
		type: link.type as IntegrationName,
		name: link.name,
		integrationId: link.integrationId,
		userLinkId: link.id,
	}));
};

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

	const [userContext, chat, userIntegrations] = await Promise.all([
		getUserContext({
			userId: userId,
			teamId: teamId,
		}),
		getChatById(chatId, teamId),
		getUserAvailableIntegrations({ userId, teamId }),
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
		.select({
			id: tasks.id,
			title: tasks.title,
			description: tasks.description,
			priority: tasks.priority,
			statusId: tasks.statusId,
			assigneeId: tasks.assigneeId,
			projectId: tasks.projectId,
			milestoneId: tasks.milestoneId,
			dueDate: tasks.dueDate,
			statusName: statuses.name,
			assigneeName: users.name,
			projectName: projects.name,
			milestoneName: milestones.name,
		})
		.from(tasks)
		.leftJoin(statuses, eq(tasks.statusId, statuses.id))
		.leftJoin(users, eq(tasks.assigneeId, users.id))
		.leftJoin(projects, eq(tasks.projectId, projects.id))
		.leftJoin(milestones, eq(tasks.milestoneId, milestones.id))
		.where(and(eq(tasks.id, taskId), eq(tasks.teamId, teamId)))
		.limit(1);

	if (!task) {
		throw new Error("Task not found");
	}

	// Fetch task labels
	const taskLabels = await db
		.select({
			id: labels.id,
			name: labels.name,
		})
		.from(labelsOnTasks)
		.innerJoin(labels, eq(labelsOnTasks.labelId, labels.id))
		.where(eq(labelsOnTasks.taskId, taskId));

	const unsavedMessages: {
		message: UIChatMessage;
		createdAt: string;
	}[] = [];

	const taskComments = await db
		.select()
		.from(activities)
		.where(
			and(
				or(eq(activities.groupId, commentId), eq(activities.groupId, taskId)),
				eq(activities.teamId, teamId),
				eq(activities.type, "task_comment"),
			),
		)
		.orderBy(asc(activities.createdAt))
		.limit(10);

	for (const oldComment of taskComments) {
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

		unsavedMessages.push({
			message,
			createdAt: oldComment.createdAt!,
		});
	}

	unsavedMessages.push({
		message: userMessage,
		createdAt: new Date().toISOString(),
	});

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

	// Build recent comments for context
	const recentCommentsForContext = taskComments
		.filter((c) => c.metadata?.comment)
		.slice(-10)
		.map((c) => ({
			author: c.userId ?? "Unknown",
			content: c.metadata?.comment as string,
			createdAt: c.createdAt ?? new Date().toISOString(),
		}));

	const baseContext = buildAppContext(
		{
			...userContext,
			integrationType: "web",
		},
		chatId,
	);

	// Build TaskAssistantContext with task details and available integrations
	const taskAssistantContext: TaskAssistantContext = {
		...baseContext,
		task: {
			id: task.id,
			title: task.title,
			description: task.description ?? undefined,
			status: task.statusName ?? undefined,
			statusId: task.statusId ?? undefined,
			priority: task.priority ?? undefined,
			assignee: task.assigneeName ?? undefined,
			assigneeId: task.assigneeId ?? undefined,
			project: task.projectName ?? undefined,
			projectId: task.projectId ?? undefined,
			milestone: task.milestoneName ?? undefined,
			milestoneId: task.milestoneId ?? undefined,
			dueDate: task.dueDate ?? undefined,
			labels: taskLabels,
		},
		recentComments: recentCommentsForContext,
		availableIntegrations: userIntegrations,
	};

	// Get enabled integrations that have tools registered
	const enabledIntegrations = userIntegrations
		.map((i) => i.type)
		.filter((type) => integrationTools[type] !== undefined);

	// Use the appropriate agent based on available integrations
	const agent =
		enabledIntegrations.length > 0
			? createTaskAssistantWithIntegrations(enabledIntegrations)
			: taskAssistantAgent;

	const response = await agent.generate({
		message: userMessage,
		context: taskAssistantContext,
	});

	const body =
		response.parts[response.parts.length - 1]?.type === "text"
			? (
					response.parts[
						response.parts.length - 1
					] as UIMessage["parts"][number] & {
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
