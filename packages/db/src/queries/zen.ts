import { endOfDay } from "date-fns";
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
import { activities, tasks, users } from "../schema";
import { getTasks } from "./tasks";
import { getCurrentUser } from "./users";

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
	const user = await getCurrentUser(userId, teamId);
	const queueTasksIds = queue.data.map((task) => task.id);

	const lastZenMode = user.lastZenModeAt || new Date(0);

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
