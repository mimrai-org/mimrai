import { TZDate } from "@date-fns/tz";
import { createActivity } from "@mimir/db/queries/activities";
import { getSystemUser } from "@mimir/db/queries/users";
import {
	activities,
	autopilotSettings,
	statuses,
	tasks,
	teams,
} from "@mimir/db/schema";
import { logger, schemaTask } from "@trigger.dev/sdk";
import { generateText } from "ai";
import { and, desc, eq } from "drizzle-orm";
import z from "zod";
import { getDb } from "../../init";

export const createEODTeamSummaryActivityJob = schemaTask({
	id: "create-eod-team-summary-activity",
	description: "Create end-of-day team summary activity",
	schema: z.object({
		teamId: z.string(),
	}),
	run: async (payload, ctx) => {
		const { teamId } = payload;

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
			.where(eq(autopilotSettings.teamId, payload.teamId))
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

		const completedTasks = await db
			.select()
			.from(activities)
			.innerJoin(tasks, eq(activities.groupId, tasks.id))
			.innerJoin(statuses, eq(tasks.statusId, statuses.id))
			.where(
				and(
					eq(activities.teamId, teamId),
					eq(activities.type, "task_completed"),
					eq(statuses.type, "done"),
				),
			)
			.limit(20)
			.orderBy(desc(activities.createdAt));

		const inProgressTasks = await db
			.select()
			.from(tasks)
			.innerJoin(statuses, eq(tasks.statusId, statuses.id))
			.where(and(eq(tasks.teamId, teamId), eq(statuses.type, "in_progress")))
			.limit(20);

		const prompt = `Provide a brief proactive end-of-day summary for the team based on the following data.
<data>
The team completed {completedTasks.length} tasks today and has ${inProgressTasks.length} tasks currently In Progress.
<top-completed-tasks>
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
</top-completed-tasks>
</data>

<strict-rules>
	- Avoid generic statements.
	- Focus on the team's actual task data.
	- No motivational language.
	- Be human and empathetic.
	- No more than 30 words.
	- The data is already beign shared, do not repeat it. just provide the summary.
</strict-rules>


<team-context>
	- Team Name: ${team.name}
	- Team description: ${team.description || "None"}
	- Locale: ${team.locale || "en-US"}
</team-context>`;

		console.log(prompt);

		const summary = await generateText({
			model: "gpt-4o-mini",
			prompt,
		});

		console.log(summary.usage);

		const user = await getSystemUser();

		logger.info(summary.text);

		await createActivity({
			teamId,
			userId: user.id,
			type: "daily_team_summary",
			metadata: {
				content: `Wrapping up the day team,

✅ ${completedTasks.length} tasks completed today.
${completedTasks.map((task) => `- ${task.tasks.title}`).join("\n")}
🚧 ${inProgressTasks.length} tasks currently In Progress.

${summary.text}
`,
			},
		});
	},
});
