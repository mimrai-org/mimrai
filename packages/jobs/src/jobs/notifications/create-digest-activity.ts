import { TZDate } from "@date-fns/tz";
import { getDb } from "@jobs/init";
import { createActivity } from "@mimir/db/queries/activities";
import { autopilotSettings, columns, tasks, teams } from "@mimir/db/schema";
import { getTaskPermalink } from "@mimir/utils/tasks";
import { logger, schemaTask } from "@trigger.dev/sdk";
import { generateText } from "ai";
import { format } from "date-fns";
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

export const createDigestActivityJob = schemaTask({
	id: "send-digest-notification",
	description: "Send digest notification",
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
					eq(autopilotSettings.teamId, teamId),
					or(
						isNull(autopilotSettings.allowedWeekdays),
						arrayContains(autopilotSettings.allowedWeekdays, [currentWeekday]),
					),
				),
			)
			.limit(1);

		if (!settings || !settings.enabled) {
			logger.info(
				`Autopilot settings disabled for team ID ${teamId}. Exiting.`,
			);
			return;
		}

		const pendingTasks = await db
			.select()
			.from(tasks)
			.where(
				and(
					eq(tasks.assigneeId, userId),
					eq(tasks.teamId, teamId),
					inArray(columns.type, ["to_do", "in_progress"]),
				),
			)
			.innerJoin(columns, eq(columns.id, tasks.columnId))
			.limit(3)
			.orderBy(
				asc(
					sql`CASE ${tasks.priority} WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 END`,
				),
				desc(tasks.dueDate),
				desc(tasks.createdAt),
			);

		const [pendingCount] = await db
			.select({
				count: count(tasks.id).as("count"),
				high: count(
					sql`CASE WHEN ${tasks.priority} IN ('urgent', 'high') THEN 1 END`,
				).as("high"),
			})
			.from(tasks)
			.innerJoin(columns, eq(columns.id, tasks.columnId))
			.where(
				and(
					eq(tasks.assigneeId, userId),
					eq(tasks.teamId, teamId),
					inArray(columns.type, ["to_do", "in_progress"]),
				),
			);

		const recommendation = await generateText({
			model: "gpt-4o-mini",
			prompt: `Provide a brief motivational message for a user who has ${pendingCount.count} pending tasks, with ${pendingCount.high} high-priority tasks. Keep it under 20 words.
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
			type: "daily_digest",
			metadata: {
				content: `Morning, ${payload.userName}!

⏱️ You have ${pendingCount.count} pending tasks.
🔥 ${pendingCount.high} high-priority

${pendingTasks.length > 0 ? "Here are your top tasks:" : "No tasks pending!"}
${pendingTasks
	.map(
		(task, index) =>
			`${index + 1}. ${task.tasks.title} 
	- Priority: ${task.tasks.priority}
	- Due: ${
		task.tasks.dueDate
			? format(task.tasks.dueDate, "MMMM do, yyyy")
			: "No due date"
	}
	- Link: ${getTaskPermalink(task.tasks.permalinkId)}`,
	)
	.join("\n")}

${recommendation.text}
`,
			},
		});
	},
});
