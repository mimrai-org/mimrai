import { TZDate } from "@date-fns/tz";
import { createActivity } from "@mimir/db/queries/activities";
import {
	activities,
	autopilotSettings,
	statuses,
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
import { getDb } from "../../init";

export const createEODActivityJob = schemaTask({
	id: "create-eod-activity",
	description: "Create end-of-day activity for a user",
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
			if (process.env.NODE_ENV === "development") {
				logger.info(
					`Autopilot settings not found or disabled for team ID ${teamId}. Continuing in development mode.`,
				);
			} else {
				logger.info(
					`Autopilot settings disabled for team ID ${teamId}. Exiting.`,
				);
				return;
			}
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
			.innerJoin(statuses, eq(statuses.id, tasks.statusId))
			.where(and(...taskWhereClause, inArray(statuses.type, ["to_do"])));

		const [inProgressTasksCount] = await db
			.select({
				count: count(tasks.id).as("count"),
			})
			.from(tasks)
			.innerJoin(statuses, eq(statuses.id, tasks.statusId))
			.where(and(...taskWhereClause, inArray(statuses.type, ["in_progress"])));

		const completedTasks = await db
			.select()
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

		const prompt = `Provide a brief end-of-day summary for the user based on their task activity.
The user had ${todoTasksCount.count} tasks in To Do, ${inProgressTasksCount.count} tasks In Progress, and completed ${completedTasks.length} tasks today.
Keep it under 30 words.

<strict-rules>
	- Avoid generic statements.
	- Focus on the user's actual task data.
	- No motivational language.
	- Be human and empathetic.
</strict-rules>

<completed-tasks>
${completedTasks
	.map(
		(task) =>
			`- ${task.tasks.title}, Priority: ${task.tasks.priority}, Due: ${
				task.tasks.dueDate
					? new TZDate(
							new Date(task.tasks.dueDate),
							team.timezone || "UTC",
						).toLocaleDateString(team.locale || "en-US")
					: "None"
			})`,
	)
	.join("\n")}
</completed-tasks>

<team-context>
	- Team Name: ${team.name}
	- Team description: ${team.description || "None"}
	- Locale: ${team.locale || "en-US"}
</team-context>`;

		console.log(prompt);

		const recommendation = await generateText({
			model: "gpt-4o-mini",
			prompt,
		});

		console.log(recommendation.usage);

		console.log(recommendation.text);

		await createActivity({
			teamId,
			userId,
			type: "daily_end_of_day",
			metadata: {
				content: `Wrapping up the day, ${payload.userName}

✅ You completed ${completedTasks.length} tasks today.
📝 You still have ${todoTasksCount.count} tasks in To Do.
🚧 You left ${inProgressTasksCount.count} tasks In Progress.

${recommendation.text}
`,
			},
		});
	},
});
