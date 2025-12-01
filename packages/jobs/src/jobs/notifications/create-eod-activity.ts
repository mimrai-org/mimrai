import { TZDate } from "@date-fns/tz";
import { getDb } from "@jobs/init";
import { createActivity } from "@mimir/db/queries/activities";
import {
	activities,
	autopilotSettings,
	columns,
	tasks,
	teams,
} from "@mimir/db/schema";
import { logger, schemaTask } from "@trigger.dev/sdk";
import { generateText } from "ai";
import {
	and,
	arrayContains,
	asc,
	count,
	desc,
	eq,
	inArray,
	isNull,
	or,
	sql,
} from "drizzle-orm";
import z from "zod";

export const createEODActivityJob = schemaTask({
	id: "send-eod-notification",
	description: "Send end of day notification",
	schema: z.object({
		userId: z.string(),
		userName: z.string(),
		teamId: z.string(),
	}),
	run: async (payload, ctx) => {
		const { userId, teamId } = payload;

		const db = getDb();
		const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
		if (!team) {
			throw new Error("Team not found");
		}

		const currentDate = new TZDate(new Date(), team.timezone || "UTC");
		const currentWeekday = currentDate.getDay(); // 0 (Sun) to 6 (Sat)

		const [settings] = await db
			.select()
			.from(autopilotSettings)
			.where(
				and(
					eq(autopilotSettings.teamId, payload.teamId),
					or(
						isNull(autopilotSettings.allowedWeekdays),
						arrayContains(autopilotSettings.allowedWeekdays, [currentWeekday]),
					),
				),
			)
			.limit(1);

		if (!settings || !settings.enabled) {
			logger.info(
				`Autopilot settings disabled for team ID ${payload.teamId}. Exiting.`,
			);
			return;
		}

		const taskWhereClause = [
			eq(tasks.assigneeId, userId),
			eq(tasks.teamId, teamId),
		];
		const taskOrderBy = [
			asc(
				sql`CASE ${tasks.priority} WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 END`,
			),
			desc(tasks.dueDate),
			desc(tasks.createdAt),
		];

		const [todoTasksCount] = await db
			.select({
				count: count(tasks.id).as("count"),
			})
			.from(tasks)
			.innerJoin(columns, eq(columns.id, tasks.columnId))
			.where(and(...taskWhereClause, inArray(columns.type, ["to_do"])));

		const [inProgressTasksCount] = await db
			.select({
				count: count(tasks.id).as("count"),
			})
			.from(tasks)
			.innerJoin(columns, eq(columns.id, tasks.columnId))
			.where(and(...taskWhereClause, inArray(columns.type, ["in_progress"])));

		const [completedTasksCount] = await db
			.select({
				count: count(activities.id).as("count"),
			})
			.from(activities)
			.innerJoin(tasks, eq(tasks.id, activities.groupId))
			.where(
				and(
					eq(activities.type, "task_completed"),
					...taskWhereClause,
					// Only tasks completed today
					sql`DATE(${activities.createdAt}) = CURRENT_DATE`,
				),
			);

		const recommendation = await generateText({
			model: "gpt-4o-mini",
			prompt: `Provide a brief end-of-day summary for the user based on their task activity.
			The user had ${todoTasksCount.count} tasks in To Do, ${inProgressTasksCount.count} tasks In Progress, and completed ${completedTasksCount.count} tasks today.
			Keep it under 30 words.

      <team-context>
        - Team Name: ${team.name}
        - Team description: ${team.description || "No description"}
        - Locale: ${team.locale || "en-US"}
      </team-context>
      `,
		});

		await createActivity({
			teamId,
			userId,
			type: "daily_end_of_day",
			metadata: {
				content: `Wrapping up the day, ${payload.userName}!

✅ You completed ${completedTasksCount.count} tasks today.
📝 You still have ${todoTasksCount.count} tasks in To Do.
🚧 You left ${inProgressTasksCount.count} tasks In Progress.

${recommendation.text}
`,
			},
		});
	},
});
