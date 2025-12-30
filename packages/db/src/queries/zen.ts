import {
	and,
	arrayContains,
	desc,
	eq,
	gte,
	inArray,
	not,
	or,
} from "drizzle-orm";
import { db } from "..";
import {
	activities,
	tasks,
	users,
	type ZenModeSettings,
	zenModeSettings,
} from "../schema";
import { getTasks } from "./tasks";

export const getZenQueue = async ({
	userId,
	teamId,
}: {
	userId: string;
	teamId: string;
}) => {
	return await getTasks({
		teamId,
		assigneeId: [userId],
		statusType: ["to_do", "in_progress"],
		view: "board",
		pageSize: 20,
	});
};

export const getZenOrientation = async ({
	userId,
	teamId,
}: {
	userId: string;
	teamId: string;
}) => {
	const queue = await getZenQueue({ userId, teamId });
	const settings = await getZenModeSettings({ userId, teamId });
	const queueTasksIds = queue.data.map((task) => task.id);

	const lastZenMode = settings.lastZenModeAt || new Date(0);

	const tasksActivities = await db
		.select()
		.from(activities)
		.where(
			and(
				eq(activities.teamId, teamId),
				inArray(activities.type, ["task_comment", "follow_up", "mention"]),
				gte(activities.createdAt, lastZenMode.toISOString()),
				eq(activities.status, "unread"),
				not(eq(activities.userId, userId)),
				or(
					inArray(activities.groupId, queueTasksIds),
					arrayContains(tasks.mentions, [userId]),
				),
			),
		)
		.leftJoin(tasks, eq(activities.groupId, tasks.id))
		.innerJoin(users, eq(activities.userId, users.id))
		.orderBy(desc(activities.priority))
		.limit(20);

	// Filter activities to only the important ones
	const importantActivities = tasksActivities.filter((activity) => {
		if (activity.activities.type === "task_comment") {
			const subscribers = activity.activities.metadata?.subscribers as
				| string[]
				| undefined;

			// remove activity if user is not a subscriber
			if (!subscribers || !subscribers.includes(userId)) {
				return false;
			}
		}
		return true;
	});

	return {
		activities: importantActivities,
	};
};

export const updateLastZenModeAt = async ({
	userId,
	teamId,
	date,
}: {
	userId: string;
	teamId: string;
	date: Date;
}) => {
	await db
		.insert(zenModeSettings)
		.values({
			lastZenModeAt: date,
			userId,
			teamId,
		})
		.onConflictDoUpdate({
			target: [zenModeSettings.userId, zenModeSettings.teamId],
			set: {
				lastZenModeAt: date,
			},
		});
};

export const getZenModeSettings = async ({
	userId,
	teamId,
}: {
	userId: string;
	teamId: string;
}) => {
	const [settings] = await db
		.select()
		.from(zenModeSettings)
		.where(
			and(
				eq(zenModeSettings.userId, userId),
				eq(zenModeSettings.teamId, teamId),
			),
		)
		.limit(1);

	if (!settings) {
		const [newSettings] = await db
			.insert(zenModeSettings)
			.values({
				userId,
				teamId,
			})
			.returning();
		return newSettings!;
	}

	return settings;
};

export const updateZenModeSettings = async ({
	userId,
	teamId,
	settings,
}: {
	userId: string;
	teamId: string;
	settings: ZenModeSettings;
}) => {
	await db
		.insert(zenModeSettings)
		.values({
			userId,
			teamId,
			settings,
		})
		.onConflictDoUpdate({
			target: [zenModeSettings.userId, zenModeSettings.teamId],
			set: {
				settings,
			},
		});
};
