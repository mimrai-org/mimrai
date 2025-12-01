import { openai } from "@ai-sdk/openai";
import { getDb } from "@jobs/init";
import { createActivity } from "@mimir/db/queries/activities";
import { createTaskSuggestion } from "@mimir/db/queries/tasks-suggestions";
import { columns, tasks, teams, users, usersOnTeams } from "@mimir/db/schema";
import { logger, schemaTask } from "@trigger.dev/sdk";
import { generateObject } from "ai";
import { and, eq, inArray, isNull, lte, not, sql } from "drizzle-orm";
import z from "zod";

export const generateTeamSuggestionsJob = schemaTask({
	id: "generate-team-suggestions-job",
	schema: z.object({
		teamId: z.string(),
	}),
	run: async (payload, ctx) => {
		const db = getDb();

		const [team] = await db
			.select()
			.from(teams)
			.where(eq(teams.id, payload.teamId))
			.limit(1);

		if (!team) {
			logger.warn(`Team with ID ${payload.teamId} not found. Exiting.`);
			return;
		}

		// Find tasks that have been in the same column for more than 7 days
		const inactiveTasks = await db
			.select()
			.from(tasks)
			.where(
				and(
					eq(tasks.teamId, payload.teamId),
					not(inArray(columns.type, ["done", "backlog"])),
					lte(tasks.updatedAt, sql`NOW() - INTERVAL '7 days'`),
				),
			)
			.innerJoin(columns, eq(columns.id, tasks.columnId))
			.limit(10);

		// Find tasks that are overdue
		const overdueTasks = await db
			.select()
			.from(tasks)
			.where(
				and(
					eq(tasks.teamId, payload.teamId),
					not(inArray(columns.type, ["done", "backlog"])),
					lte(tasks.dueDate, sql`NOW()`),
				),
			)
			.innerJoin(columns, eq(columns.id, tasks.columnId))
			.limit(10);

		// Find tasks without assignees
		const unassignedTasks = await db
			.select()
			.from(tasks)
			.where(
				and(
					eq(tasks.teamId, payload.teamId),
					not(inArray(columns.type, ["done", "backlog"])),
					isNull(tasks.assigneeId),
				),
			)
			.innerJoin(columns, eq(columns.id, tasks.columnId))
			.limit(10);

		// If no tasks found, exit early
		if (
			inactiveTasks.length === 0 &&
			overdueTasks.length === 0 &&
			unassignedTasks.length === 0
		) {
			logger.info("No tasks found for suggestions. Exiting.");
			return;
		}

		// Find team members
		const teamMembers = await db
			.select()
			.from(usersOnTeams)
			.where(eq(usersOnTeams.teamId, payload.teamId))
			.innerJoin(users, eq(users.id, usersOnTeams.userId));

		// Find team columns
		const columnsInTeam = await db
			.select()
			.from(columns)
			.where(eq(columns.teamId, payload.teamId));

		const prompt = `
<guidelines>
	- Do not make up any information. Only use the data provided.
	- Respect the team's timezone and locale when suggesting follow-up messages.
	- For each user, decide:
		- if they need a follow-up message, and what it should say
			- Make the message friendly and helpful, do not pressure the user
			- mention any relevant tasks that need their attention
		- if any tasks need proactive updates to help move them along
		- suggest proactive task updates to help move things along
	- Suggest simple updates. Eg.:
		- assign to a specific user, if the task is unassigned based on team members descriptions
		- move to a different column, if the task seems stuck in the current column
		- add a comment to the task, suggesting next steps or asking for clarification
		- never suggest moving a task forward if it is overdue or inactive, instead suggest re-assigning or commenting
	- Provide a reason for each suggested update
		- Include task title in the reason for context
		- Include the overdue or inactive duration in the reason if relevant
		- If the the update involves assigning include the user name
</guidelines>

<team-context>
	timezone: ${team.timezone || "UTC"}
	description: ${team.description || "No description provided"}
	locale: ${team.locale || "en-US"}
	current date: ${new Date().toLocaleDateString(team.locale || "en-US", {
		timeZone: team.timezone || "UTC",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	})}
</team-context>

<tasks>
	INACTIVES:
	${
		inactiveTasks
			.map(
				(t) =>
					`- [${t.tasks.id}] "${t.tasks.title}" in column [${t.columns.id}] "${t.columns.name}" assigned to userId ${t.tasks.assigneeId}, last updated at ${t.tasks.updatedAt}, priority: ${t.tasks.priority}`,
			)
			.join("\n") || "No inactive tasks."
	}

	OVERDUE:
	${
		overdueTasks
			.map(
				(t) =>
					`- [${t.tasks.id}] "${t.tasks.title}" in column [${t.columns.id}] "${t.columns.name}" assigned to userId ${t.tasks.assigneeId}, due at ${t.tasks.dueDate}, priority: ${t.tasks.priority}`,
			)
			.join("\n") || "No overdue tasks."
	}

	UNASSIGNED:
	${
		unassignedTasks
			.map(
				(t) =>
					`- [${t.tasks.id}] "${t.tasks.title}" in column "${t.columns.name}", created at ${t.tasks.createdAt}, priority: ${t.tasks.priority}`,
			)
			.join("\n") || "No unassigned tasks."
	}
</tasks>

<team-members>
	${teamMembers
		.map(
			(tm) =>
				`- userId: ${tm.user.id}, name: ${tm.user.name}, description: ${tm.users_on_teams.description || "No description"}`,
		)
		.join("\n")}
</team-members>

<team-columns>
	${columnsInTeam
		.map(
			(col) =>
				`- columnId: ${col.id}, name: ${col.name}, type: ${col.type}, description: ${col.description || "No description"}`,
		)
		.join("\n")}
</team-columns>
      `;

		const output = await generateObject({
			model: openai("gpt-4o-mini"),
			schema: z.object({
				followUps: z.array(
					z.object({
						userId: z.string().describe("User ID (uuid)"),
						message: z
							.string()
							.describe("The follow-up message to send to the user"),
					}),
				),
				suggestions: z.array(
					z.object({
						taskId: z.string().describe("Task ID (uuid) to update"),
						action: z
							.enum(["assign", "move", "comment"])
							.describe("The action to take on the task"),
						reason: z
							.string()
							.optional()
							.describe(
								"Reason for the action taken. Include any readable context like task title.",
							),
						assigneeId: z
							.string()
							.optional()
							.describe(
								"User ID (uuid) to assign the task to, if action is 'assign'",
							),
						columnId: z
							.string()
							.optional()
							.describe(
								"Column ID (uuid) to move the task to, if action is 'move'",
							),
						comment: z
							.string()
							.optional()
							.describe("Comment to add to the task, if action is 'comment'"),
					}),
				),
			}),
			prompt,
		});

		console.log(output.usage);
		console.log(prompt);
		console.log(output.object);

		const followUpPromises = [];
		for (const followUp of output.object.followUps) {
			// Create notification for the user
			followUpPromises.push(
				createActivity({
					userId: followUp.userId,
					teamId: payload.teamId,
					type: "follow_up",
					groupId: followUp.userId,
					metadata: {
						message: followUp.message,
					},
				}),
			);
		}
		try {
			// Await all follow-up activity creations
			await Promise.all(followUpPromises);
		} catch (error) {
			logger.error("Error creating follow-up activities", { error });
		}

		for (const suggestion of output.object.suggestions) {
			// Create task updates based on the suggestions
			await createTaskSuggestion({
				taskId: suggestion.taskId,
				content: suggestion.reason || "",
				teamId: payload.teamId,
				payload: {
					type: suggestion.action,
					assigneeId: suggestion.assigneeId,
					columnId: suggestion.columnId,
					comment: suggestion.comment,
				},
			});
		}
	},
});
