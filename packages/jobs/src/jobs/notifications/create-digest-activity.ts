import { openai } from "@ai-sdk/openai";
import { TZDate } from "@date-fns/tz";
import { createActivity } from "@mimir/db/queries/activities";
import {
	autopilotSettings,
	milestones,
	projects,
	statuses,
	tasks,
	tasksDependencies,
	teams,
} from "@mimir/db/schema";
import { getAppUrl } from "@mimir/utils/envs";
import { logger, schemaTask } from "@trigger.dev/sdk";
import { generateObject } from "ai";
import { format } from "date-fns";
import {
	and,
	arrayContains,
	asc,
	desc,
	eq,
	inArray,
	isNull,
	or,
	sql,
} from "drizzle-orm";
import z from "zod";
import { getDb } from "../../init";

export const createDigestActivityJob = schemaTask({
	id: "create-digest-activity",
	description: "Create digest activity for a user",
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

		const topPriorities = await db
			.select()
			.from(tasks)
			.where(
				and(
					eq(tasks.assigneeId, userId),
					eq(tasks.teamId, teamId),
					inArray(statuses.type, ["to_do", "in_progress"]),
				),
			)
			.innerJoin(statuses, eq(statuses.id, tasks.statusId))
			.leftJoin(projects, eq(projects.id, tasks.projectId))
			.leftJoin(milestones, eq(milestones.id, tasks.milestoneId))
			.leftJoin(
				tasksDependencies,
				and(
					eq(tasksDependencies.taskId, tasks.id),
					eq(tasksDependencies.type, "blocks"),
				),
			)
			.limit(5)
			.orderBy(
				asc(sql`CASE ${statuses.type} WHEN 'in_progress' THEN 1 ELSE 2 END`),
				asc(
					sql`CASE ${tasks.priority} WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 END`,
				),
				desc(tasks.dueDate),
				desc(tasks.createdAt),
			);

		const groupByTaskId: Record<
			string,
			Omit<(typeof topPriorities)[0], "tasks_dependencies"> & {
				taskDependencies: (typeof topPriorities)[0]["tasks_dependencies"][];
			}
		> = {};
		topPriorities.forEach((tp) => {
			if (!groupByTaskId[tp.tasks.id]) {
				groupByTaskId[tp.tasks.id] = {
					...tp,
					taskDependencies: [],
				};
			}
			if (tp.tasks_dependencies) {
				groupByTaskId[tp.tasks.id].taskDependencies!.push(
					tp.tasks_dependencies,
				);
			}
		});
		const uniqueTopPriorities = Object.values(groupByTaskId);

		const tasksProjectsIds = uniqueTopPriorities
			.map((tp) => tp.tasks.projectId)
			.filter((id): id is string => typeof id === "string");
		const tasksMilestonesIds = uniqueTopPriorities
			.map((tp) => tp.tasks.milestoneId)
			.filter((id): id is string => typeof id === "string");

		const projectsList = await db
			.select()
			.from(projects)
			.where(
				and(
					eq(projects.teamId, teamId),
					inArray(projects.id, tasksProjectsIds),
				),
			)
			.orderBy(asc(projects.name));

		const milestonesList = await db
			.select()
			.from(milestones)
			.where(
				and(
					eq(milestones.teamId, teamId),
					inArray(milestones.id, tasksMilestonesIds),
				),
			)
			.orderBy(asc(milestones.name));

		const projectsWithMilestones = projectsList.map((project) => {
			const projectMilestones = milestonesList.filter(
				(milestone) => milestone.projectId === project.id,
			);
			return {
				...project,
				milestones: projectMilestones,
			};
		});

		const prompt = `
You are Mimir, an AI productivity companion that helps users stay focused on their most important tasks. Today (${format(currentDate, "yyyy-MM-dd")}), you will provide a daily digest to help the user prioritize their work.

<strict-rules>
	- No exclamation marks.
	- No motivational language.
	- Do not restate the same reason twice.
	- Be human and empathetic.
	- IMPORTANT: Use only real data for your reasoning. If no data is available, say that you cannot determine importance.
	- Infer project and milestone importance based on their descriptions only if available.
	- The examples provided are simply examples. Do not copy them. Be original and generate unique explanations based on the actual data provided.
	- Use the tasks updatedAt field to determine recency or abandoned status if needed.
</strict-rules>

<importance-criteria>
- Tasks already in progress (if it can be finished today according to due date)
	Example: “This task is already in progress”, “You've already started this task”, “Continuing this task maintains flow on what you began earlier”
- Task Priorities (based on task priority: urgent, high, medium, low)
	Example: "This task is marked as {priority} priority", “The priority level for this task is {priority}”
- Tasks Due dates (based on tasks due date if available)
	Example if due today: "This task is due today", “This task needs to be completed today to meet its deadline”
	Example if overdue: "This task is overdue by {n} days", “The deadline for this task has passed by {n} days”
	Example if due soon: “This task is due on {date}”, “The upcoming deadline for this task is {date}”
- Task importance to the project milestones (based on milestone description if available)
	Example: “This task contributes to milestone {milestone.name} due {milestone.dueDate}”
- Task importance to the project itself (based on project description if available)
	Example: "This task is important for the success of the project {name} because {reason from project description}"
- Task importance to the user's goals (only if user goals are provided)
	Example: "This task aligns with your personal goal of {user goal} because {reason from user goal}"
- Task importance to the team's goals (only if team goals are provided)
	Example: "This task supports the team's objective of {team goal} because {reason from team goal}"
</importance-criteria>


The user has the following top priority tasks:
<top-priorities>
	${uniqueTopPriorities
		.map(
			(task) =>
				`<task> 
	Task ID: ${task.tasks.id}
	Title: "${task.tasks.title}"
	Status: ${task.statuses.type} 
	Priority: ${task.tasks.priority}
	Due Date: ${
		task.tasks.dueDate
			? format(new Date(task.tasks.dueDate), "yyyy-MM-dd")
			: "None"
	}
	Updated At: ${task.tasks.updatedAt ? format(new Date(task.tasks.updatedAt), "yyyy-MM-dd") : "None"}
	Project: ${task.projects?.name || "None"}
	Milestone: ${task.milestones?.name || "None"}
	<blocks>
		${
			task.taskDependencies && task.taskDependencies.length > 0
				? task.taskDependencies
						.map((dep) => `- Blocks Task ID: ${dep.dependsOnTaskId}`)
						.join("\n")
				: "- None"
		}
	</blocks>
</task>`,
		)
		.join("\n")}
</top-priorities>

<team-context>
	- Team Name: ${team.name}
	- Team description: ${team.description || "None"}
	- Locale: ${team.locale || "en-US"}
</team-context>

<projects-and-milestones>
${projectsWithMilestones
	.map(
		(project) => `- Project: ${project.name}, ID: ${project.id}, Description: ${
			project.description || "None"
		}, Date range: ${project.startDate ? format(new Date(project.startDate), "yyyy-MM-dd") : "N/A"} to ${
			project.endDate ? format(new Date(project.endDate), "yyyy-MM-dd") : "N/A"
		}
  Milestones:
${project.milestones.map((milestone) => `    - Name: ${milestone.name}, ID: ${milestone.id}, Description: ${milestone.description || "None"}, Due Date: ${milestone.dueDate ? format(new Date(milestone.dueDate), "yyyy-MM-dd") : "N/A"}`).join("\n")}`,
	)
	.join("\n")}
</projects-and-milestones>
`;

		console.log(prompt);

		const {
			object: recommendation,
			usage,
			request,
		} = await generateObject({
			model: openai("gpt-4o-mini"),
			temperature: 0.7,
			schema: z.object({
				greetings: z
					.string()
					.describe(
						"A friendly greeting message to start the digest. Do not include the salutation or user's name.",
					),
				focusMessage: z
					.string()
					.describe(
						"A focus message for the user to concentrate on today. Mention the most important task and why it matters.",
					),
				topPriorities: z
					.array(
						z.object({
							taskId: z.string().describe("The ID (uuid) of the task"),
							title: z.string().describe("The title of the task"),
							whyImportant: z
								.string()
								.describe(
									"brief explanation of why this task is important. follow the rules strictly.",
								),
						}),
					)
					.describe(
						"The top 3 most important tasks for the user. in order for today focus. first in the array is the most important",
					),
			}),
			prompt,
		});

		console.log(usage);

		const content = `
Good Morning, ${payload.userName} 👋

${recommendation.greetings}

🔥 Your top priorities
${recommendation.topPriorities
	.map((tp) => `- ${tp.title} — ${tp.whyImportant}`)
	.join("\n")}

✨ Suggested focus for today
${recommendation.focusMessage}

Enter Zen Mode to tackle your top priority tasks: ${getAppUrl()}/team/${team.slug}/zen
`;

		logger.info(content);

		await Promise.all(
			recommendation.topPriorities.map(async (tp, index) =>
				db
					.update(tasks)
					.set({ focusOrder: index + 1, focusReason: tp.whyImportant })
					.where(eq(tasks.id, tp.taskId)),
			),
		);

		await createActivity({
			teamId,
			userId,
			type: "daily_digest",
			metadata: {
				content,
			},
		});
	},
});
