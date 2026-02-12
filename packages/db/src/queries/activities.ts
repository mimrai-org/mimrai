import { sendNotificationJob } from "@jobs/jobs/notifications/send-notification-job";
import { getChannelName, realtime } from "@mimir/realtime";
import {
	and,
	desc,
	eq,
	gte,
	type InferSelectModel,
	inArray,
	lte,
	notInArray,
	type SQL,
	sql,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { jsonBuildObject } from "src/utils/drizzle";
import { db } from "..";
import {
	activities,
	type activitySourceEnum,
	type activityStatusEnum,
	type activityTypeEnum,
	type checklistItems,
	tasks,
	users,
} from "../schema";
import {
	notificationChannels,
	shouldSendNotification,
} from "./notification-settings";
import { getStatusById } from "./statuses";
import { getMemberById } from "./teams";
import { getSystemUser } from "./users";

export type CreateActivityInput = {
	userId?: string | null;
	teamId: string;
	groupId?: string;
	replyToActivityId?: string;
	source?: (typeof activitySourceEnum.enumValues)[number];
	type: (typeof activityTypeEnum.enumValues)[number];
	metadata?: Record<string, any>;
};

export const createActivity = async (input: CreateActivityInput) => {
	let userId = input.userId;

	// If userId is not set, get system user id
	if (!userId) {
		userId = (await getSystemUser())!.id;
	}

	let metadataChanges = input.metadata?.changes;
	if (input.groupId && userId) {
		// Check if the last activity is the same type and from the same user
		const [lastActivity] = await db
			.select()
			.from(activities)
			.where(
				and(
					eq(activities.groupId, input.groupId),
					eq(activities.userId, userId),
					eq(activities.type, input.type),
					gte(activities.createdAt, sql`now() - interval '30 minutes'`),
				),
			)
			.orderBy(desc(activities.createdAt))
			.limit(1);

		// Delete the last activity if it's the same type and from the same user
		if (lastActivity?.metadata?.changes && metadataChanges) {
			// Merge the changes
			metadataChanges = {
				...lastActivity.metadata.changes,
				...metadataChanges,
			};
			await db.delete(activities).where(eq(activities.id, lastActivity.id));
		}
	}

	const [result] = await db
		.insert(activities)
		.values({
			userId: userId,
			teamId: input.teamId,
			type: input.type,
			groupId: input.groupId,
			source: input.source,
			replyToActivityId: input.replyToActivityId,
			metadata: {
				...input.metadata,
				changes: metadataChanges,
			},
		})
		.returning();

	if (input.userId && result) {
		for (const channel of notificationChannels) {
			const shouldSend = await shouldSendNotification(
				userId,
				input.teamId,
				input.type,
				channel,
			);

			if (shouldSend) {
				await sendNotificationJob.trigger(
					{
						activityId: result.id,
						channel,
					},
					{
						tags: [
							`channel:${channel}`,
							`type:${input.type}`,
							`teamId:${input.teamId}`,
							`userId:${userId}`,
							`activityId:${result.id}`,
						],
					},
				);
			}
		}

		await realtime
			.channel(getChannelName(input.teamId))
			.emit("activities.created", {
				id: result.id,
				type: result.type,
				metadata: result.metadata,
				groupId: result.groupId ?? undefined,
			});
	}

	return result;
};

export const createTaskUpdateActivity = async ({
	oldTask,
	newTask,
	userId,
	teamId,
}: {
	oldTask: InferSelectModel<typeof tasks>;
	newTask: InferSelectModel<typeof tasks>;
	userId?: string;
	teamId: string;
}) => {
	let definedUserId = userId;

	// If userId is not set, get system user id
	if (!definedUserId) definedUserId = (await getSystemUser())!.id;

	const changeKeys = [
		"title",
		"description",
		"columnId",
		"dueDate",
		"mentions",
		"assigneeId",
	] as const;
	const changes: Partial<
		Record<(typeof changeKeys)[number], Record<string, any>>
	> = {};
	if (oldTask.title !== newTask.title)
		changes.title = { value: newTask.title, oldValue: oldTask.title };
	if (oldTask.description !== newTask.description)
		changes.description = {
			value: newTask.description,
			oldValue: oldTask.description,
		};
	if (oldTask.statusId !== newTask.statusId) {
		const newColumn = await getStatusById({ id: newTask.statusId, teamId });
		changes.columnId = {
			value: newTask.statusId,
			display: newColumn.name,
			columnType: newColumn.type,
			oldValue: oldTask.statusId,
		};
	}
	if (oldTask.dueDate !== newTask.dueDate)
		changes.dueDate = { value: newTask.dueDate, oldValue: oldTask.dueDate };
	if (oldTask.assigneeId !== newTask.assigneeId && newTask.assigneeId) {
		const newAssignee = await getMemberById({
			userId: newTask.assigneeId,
			teamId,
		});
		changes.assigneeId = {
			value: newTask.assigneeId,
			display: newAssignee?.name || null,
			oldValue: oldTask.assigneeId,
		};
	}

	if (
		oldTask.mentions?.sort().toString() !== newTask.mentions?.sort().toString()
	) {
		const oldMentions = oldTask.mentions || [];
		const newMentions = newTask.mentions || [];
		const addedMentions = newMentions.filter((id) => !oldMentions.includes(id));
		const removedMentions = oldMentions.filter(
			(id) => !newMentions.includes(id),
		);

		changes.mentions = {
			value: newTask.mentions,
			added: addedMentions,
			removed: removedMentions,
			oldValue: oldTask.mentions,
		};
	}

	if (changes.assigneeId) {
		await createActivity({
			userId: definedUserId,
			teamId,
			groupId: newTask.id,
			type: "task_assigned",
			metadata: {
				title: newTask.title,
				assigneeId: changes.assigneeId.value,
				assigneeName: changes.assigneeId.display,
				subscribers: newTask.subscribers,
			},
		});
		delete changes.assigneeId;
	}

	if (changes.columnId) {
		// Track task column changed activity
		await createActivity({
			userId: definedUserId,
			teamId,
			groupId: newTask.id,
			type: "task_column_changed",
			metadata: {
				fromColumnId: changes.columnId.oldValue,
				toColumnId: changes.columnId.value,
				toColumnName: changes.columnId.display,
				toColumnType: changes.columnId.columnType,
				title: newTask.title,
				subscribers: newTask.subscribers,
			},
		});

		if (changes.columnId.columnType === "done") {
			// Track task completed activity
			await createActivity({
				userId: newTask.assigneeId ?? definedUserId,
				teamId,
				groupId: newTask.id,
				type: "task_completed",
				metadata: {
					fromColumnId: changes.columnId.oldValue,
					toColumnId: changes.columnId.value,
					toColumnName: changes.columnId.display,
					toColumnType: changes.columnId.columnType,
					title: newTask.title,
					subscribers: newTask.subscribers,
				},
			});

			await db
				.update(tasks)
				.set({
					completedAt: new Date(),
					completedBy: definedUserId,
					statusChangedAt: new Date(),
				})
				.where(eq(tasks.id, newTask.id));
		} else {
			// Delete task completed activity for the same task since only one can exist
			await db
				.delete(activities)
				.where(
					and(
						eq(activities.groupId, newTask.id),
						eq(activities.type, "task_completed"),
					),
				);

			await db
				.update(tasks)
				.set({
					completedAt: null,
					completedBy: null,
					statusChangedAt: new Date(),
				})
				.where(eq(tasks.id, newTask.id));
		}

		delete changes.columnId;
	}

	// Create mention activities
	if (changes.mentions) {
		const mentionChanges = changes.mentions;
		for (const mentionedUserId of mentionChanges.added || []) {
			const mentionedUser = await getMemberById({
				userId: mentionedUserId,
				teamId,
			});
			await createActivity({
				userId: definedUserId,
				teamId,
				groupId: newTask.id,
				type: "mention",
				source: "task",
				metadata: {
					title: newTask.title,
					mentionedUserId,
					mentionedUserName: mentionedUser?.name || null,
				},
			});
		}

		delete changes.mentions;
	}

	if (Object.keys(changes).length === 0) {
		return null;
	}

	const activity = await createActivity({
		userId,
		teamId,
		groupId: newTask.id,
		type: "task_updated",
		metadata: {
			changes,
			title: newTask.title,
			subscribers: newTask.subscribers,
		},
	});

	return activity;
};

export const getActivities = async ({
	ids,
	teamId,
	type,
	search,
	cursor,
	userId,
	groupId,
	priority,
	status,
	nStatus,
	pageSize = 20,
}: {
	ids?: string[];
	teamId?: string;
	type?: (typeof activityTypeEnum.enumValues)[number][];
	search?: string;
	groupId?: string;
	userId?: string;
	priority?: [number, number];
	status?: (typeof activityStatusEnum.enumValues)[number][];
	nStatus?: (typeof activityStatusEnum.enumValues)[number][];
	cursor?: string;
	pageSize?: number;
}) => {
	const whereClause: SQL[] = [];

	ids && whereClause.push(inArray(activities.id, ids));
	teamId && whereClause.push(eq(activities.teamId, teamId));
	type && whereClause.push(inArray(activities.type, type));
	groupId && whereClause.push(eq(activities.groupId, groupId));
	priority &&
		priority.length === 2 &&
		whereClause.push(
			and(
				gte(activities.priority, priority[0]),
				lte(activities.priority, priority[1]),
			)!,
		);
	status && whereClause.push(inArray(activities.status, status));
	nStatus && whereClause.push(notInArray(activities.status, nStatus));
	userId && whereClause.push(eq(activities.userId, userId));
	search &&
		whereClause.push(sql`activities.metadata->>'title' ILIKE ${`%${search}%`}`);

	// Convert cursor to offset
	const offset = cursor ? Number.parseInt(cursor, 10) : 0;

	const replyToActivity = alias(activities, "replyToActivity");
	const replyToUser = alias(users, "replyToUser");

	const data = await db
		.select({
			id: activities.id,
			type: activities.type,
			createdAt: activities.createdAt,
			metadata: activities.metadata,
			userId: activities.userId,
			status: activities.status,
			priority: activities.priority,
			user: {
				id: users.id,
				name: users.name,
				email: users.email,
				image: users.image,
				color: users.color,
			},
			task: {
				id: tasks.id,
				title: tasks.title,
			},
			replyToActivity: {
				id: replyToActivity.id,
				type: replyToActivity.type,
				metadata: replyToActivity.metadata,
				userId: replyToActivity.userId,
				user: jsonBuildObject({
					id: replyToUser.id,
					name: replyToUser.name,
					email: replyToUser.email,
					image: replyToUser.image,
					color: replyToUser.color,
				}),
			},
			groupId: activities.groupId,
			teamId: activities.teamId,
			reactions: sql<
				Array<{
					reaction: string;
					count: number;
					users: Array<{ id: string; name: string; image: string | null }>;
				}>
			>`COALESCE(
				(
					SELECT JSON_AGG(reaction_summary ORDER BY reaction_summary.count DESC)
					FROM (
						SELECT 
							ar.reaction,
							COUNT(*)::int as count
						FROM activity_reactions ar
						WHERE ar.activity_id = ${activities.id}
						GROUP BY ar.reaction
					) as reaction_summary
				),
				'[]'::json
			)`,
		})
		.from(activities)
		.where(and(...whereClause))
		.leftJoin(users, eq(activities.userId, users.id))
		.leftJoin(tasks, eq(activities.groupId, tasks.id))
		.leftJoin(
			replyToActivity,
			eq(activities.replyToActivityId, replyToActivity.id),
		)
		.leftJoin(replyToUser, eq(replyToActivity.userId, replyToUser.id))
		.orderBy(desc(activities.createdAt))
		.limit(pageSize ?? 20)
		.offset(offset);

	// Calculate next cursor
	const nextCursor =
		data && data.length === pageSize
			? (offset + pageSize).toString()
			: undefined;

	return {
		meta: {
			cursor: nextCursor ?? null,
			hasPreviousPage: offset > 0,
			hasNextPage: data && data.length === pageSize,
		},
		data,
	};
};

export const getActivityById = async (id: string) => {
	const [activity] = await db
		.select()
		.from(activities)
		.where(eq(activities.id, id))
		.limit(1);

	return activity;
};

export const createChecklistItemActivity = async ({
	checklistItem,
	oldChecklistItem,
	userId,
}: {
	checklistItem: InferSelectModel<typeof checklistItems>;
	oldChecklistItem?: InferSelectModel<typeof checklistItems>;
	userId?: string;
}) => {
	let definedUserId = userId;

	// If userId is not set, get system user id
	if (!definedUserId) definedUserId = (await getSystemUser())!.id;

	if (checklistItem.taskId) {
		const [task] = await db
			.select()
			.from(tasks)
			.where(
				and(
					eq(tasks.id, checklistItem.taskId),
					eq(tasks.teamId, checklistItem.teamId),
				),
			)
			.limit(1);

		if (!task) return;

		if (oldChecklistItem) {
			const changes: Partial<
				Record<"title" | "isCompleted", Record<string, any>>
			> = {};
			if (oldChecklistItem.isCompleted !== checklistItem.isCompleted) {
				changes.isCompleted = {
					value: checklistItem.isCompleted,
					oldValue: oldChecklistItem.isCompleted,
				};
			}

			if (changes.isCompleted?.value && !changes.isCompleted?.oldValue) {
				await createActivity({
					userId: definedUserId,
					teamId: checklistItem.teamId,
					groupId: checklistItem.taskId,
					type: "checklist_item_completed",
					metadata: {
						checklistItemId: checklistItem.id,
						title: task.title,
						subscribers: task.subscribers,
					},
					source: "checklist_item",
				});

				delete changes.isCompleted;
			} else if (changes.isCompleted?.oldValue && !changes.isCompleted?.value) {
				// Delete checklist item completed activity for the same checklist item since only one can exist
				await db
					.delete(activities)
					.where(
						and(
							eq(activities.groupId, checklistItem.taskId),
							sql`${activities.metadata}->>'checklistItemId' = ${checklistItem.id}`,
							eq(activities.type, "checklist_item_completed"),
						),
					);

				delete changes.isCompleted;
			}
		} else {
			await createActivity({
				userId: definedUserId,
				teamId: checklistItem.teamId,
				groupId: checklistItem.taskId,
				type: "checklist_item_created",
				metadata: {
					checklistItemId: checklistItem.id,
					title: task.title,
					subscribers: task.subscribers,
				},
				source: "checklist_item",
			});
		}
	}
};

export const deleteActivity = async ({
	id,
	teamId,
}: {
	id: string;
	teamId?: string;
}) => {
	const whereClause: SQL[] = [eq(activities.id, id)];
	teamId && whereClause.push(eq(activities.teamId, teamId));
	const [data] = await db
		.delete(activities)
		.where(and(...whereClause))
		.returning();
	return data;
};

export const bulkUpdateActivity = async ({
	ids,
	status,
	userId,
	teamId,
}: {
	ids: string[];
	status?: (typeof activityStatusEnum.enumValues)[number];
	userId?: string;
	teamId?: string;
}) => {
	const whereClause: SQL[] = [inArray(activities.id, ids)];

	userId && whereClause.push(eq(activities.userId, userId));
	teamId && whereClause.push(eq(activities.teamId, teamId));
	const data = await db
		.update(activities)
		.set({ status })
		.where(and(...whereClause))
		.returning();
	return data;
};

export const getActivitiesCount = async ({
	teamId,
	userId,
	status,
}: {
	teamId: string;
	userId?: string;
	status?: (typeof activityStatusEnum.enumValues)[number][];
}) => {
	const whereClause: SQL[] = [eq(activities.teamId, teamId)];

	userId && whereClause.push(eq(activities.userId, userId));
	status && whereClause.push(inArray(activities.status, status));
	const [record] = await db
		.select({
			count: sql`COUNT(*)`,
		})
		.from(activities)
		.where(and(...whereClause));
	if (!record) return 0;

	return Number(record.count);
};

export const hasNewActivities = async ({
	teamId,
	userId,
}: {
	teamId: string;
	userId: string;
}) => {
	const [record] = await db
		.select({
			id: activities.id,
		})
		.from(activities)
		.where(
			and(
				eq(activities.teamId, teamId),
				eq(activities.userId, userId),
				eq(activities.status, "unread"),
				gte(activities.createdAt, sql`now() - interval '7 days'`),
			),
		)
		.limit(1);

	return !!record;
};

export const updateActivity = async ({
	id,
	status,
	userId,
	teamId,
	metadata,
}: {
	id: string;
	status?: (typeof activityStatusEnum.enumValues)[number];
	userId?: string;
	teamId?: string;
	metadata?: Record<string, any>;
}) => {
	const whereClause: SQL[] = [eq(activities.id, id)];

	userId && whereClause.push(eq(activities.userId, userId));
	teamId && whereClause.push(eq(activities.teamId, teamId));
	const [data] = await db
		.update(activities)
		.set({
			metadata,
			status,
		})
		.where(and(...whereClause))
		.returning();
	return data;
};
