import { openai } from "@ai-sdk/openai";
import { getDb } from "@jobs/init";
import { columns, tasks } from "@mimir/db/schema";
import { schemaTask } from "@trigger.dev/sdk";
import { generateObject } from "ai";
import { and, eq, inArray, lte, not, sql } from "drizzle-orm";
import z from "zod";

export const followUpTeamJob = schemaTask({
	id: "follow-up-team-job",
	schema: z.object({
		teamId: z.string(),
	}),
	run: async (payload, ctx) => {
		const db = getDb();

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
			.limit(50);

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
			.limit(50);

		// Find tasks without assignees
		const unassignedTasks = await db
			.select()
			.from(tasks)
			.where(
				and(
					eq(tasks.teamId, payload.teamId),
					not(inArray(columns.type, ["done", "backlog"])),
					eq(tasks.assigneeId, null),
				),
			)
			.innerJoin(columns, eq(columns.id, tasks.columnId))
			.limit(50);

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
				task_updates: z.array(
					z.object({
						taskId: z.string().describe("Task ID to update"),
						action: z
							.enum(["assign", "move", "comment"])
							.describe("The action to take on the task"),
						reason: z
							.string()
							.optional()
							.describe("Reason for the action taken"),
						assignToUserId: z
							.string()
							.optional()
							.describe("User ID to assign the task to, if action is 'assign'"),
						moveToColumnId: z
							.string()
							.optional()
							.describe("Column ID to move the task to, if action is 'move'"),
						comment: z
							.string()
							.optional()
							.describe("Comment to add to the task, if action is 'comment'"),
					}),
				),
			}),
			prompt: `
        <guidelines>
          - Group tasks by owner (if assigned)
          - For each user, decide:
            - which 1-3 tasks to highlight as priority
            - if they need a follow-up message, and what it should say
          - Suggest simple automatic updates when safe (e.g., move clearly dead tasks to "To do" or "Backlog")
        </guidelines>

        <tasks>
        INACTIVES:
        ${inactiveTasks
					.map(
						(t) =>
							`- [${t.tasks.id}] "${t.tasks.title}" in column [${t.columns.id}] "${t.columns.name}" assigned to userId ${t.tasks.assigneeId}, last updated at ${t.tasks.updatedAt}`,
					)
					.join("\n")}

        OVERDUE:
        ${overdueTasks
					.map(
						(t) =>
							`- [${t.tasks.id}] "${t.tasks.title}" in column [${t.columns.id}] "${t.columns.name}" assigned to userId ${t.tasks.assigneeId}, due at ${t.tasks.dueDate}`,
					)
					.join("\n")}

        UNASSIGNED:
        ${unassignedTasks
					.map(
						(t) =>
							`- [${t.tasks.id}] "${t.tasks.title}" in column "${t.columns.name}"`,
					)
					.join("\n")}
        </tasks>
      `,
		});

		console.log("Generated follow-up output:", output.object);
	},
});
