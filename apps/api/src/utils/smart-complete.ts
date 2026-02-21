import { getUserContext } from "@api/ai/utils/get-user-context";
import { TZDate } from "@date-fns/tz";
import { getSmartCompleteContext } from "@mimir/db/queries/tasks";
import { priorityEnum } from "@mimir/db/schema";
import z from "zod";

export const buildSmartCompletePrompt = async ({
	userPrompt,
	userId,
	teamId,
}: {
	userPrompt: string;
	userId: string;
	teamId: string;
}) => {
	const userContext = await getUserContext({
		userId,
		teamId,
	});

	const completeContext = await getSmartCompleteContext({
		teamId,
	});

	return `You are the responsible for generating task details based on a description given by the user. Use the context provided to you to generate the most accurate and relevant task details possible.

<task-description>
${userPrompt}
</task-description>

<rules>
- Keep the title concise and self-explanatory.
- The description should provide enough detail for someone to understand the task without further clarification.
- return dates in UTC ISO 8601 format.
- If the task is recurring, provide a cron expression (5 fields: minute hour day-of-month month day-of-week). Otherswise, set recurring to null.
- Use provided ID for labels and assignees, do not invent new ones.
- If you don't have enough information to fill a field, set it to null.
- Do not include any information that is not relevant to the task details.
</rules>

<user-context>
user name: ${userContext.fullName}
user ID: ${userContext.userId}
locale: ${userContext.locale}
current date: ${new TZDate(new Date(), userContext.timezone).toISOString()}
team description: "${userContext.teamDescription}"
team name: ${userContext.teamName}
timezone: ${userContext.timezone}
</user-context>

<labels>
${completeContext.labels.map((label) => `- Name: ${label.name}, Id: ${label.id}, Description: ${label.description || "None"}`).join("\n")}
</labels>
<team-members>
${completeContext.members.map((member) => `- Name: ${member.name}, Id: ${member.id}, Description: ${member.description || "None"}`).join("\n")}
</team-members>
<projects>
${completeContext.projects.map((project) => `- Name: ${project.name}, Id: ${project.id}, Description: ${project.description || "None"}`).join("\n")}
</projects>
`;
};

export const smartCompleteResponseSchema = z.object({
	title: z
		.string()
		.min(1)
		.max(255)
		.describe("Title of the task, must be self explanatory"),
	priority: z
		.enum(priorityEnum.enumValues)
		.nullable()
		.describe("Priority of the task"),
	dueDate: z
		.string()
		.nullable()
		.describe("Due date of the task in ISO 8601 format"),
	labels: z
		.array(z.string())
		.nullable()
		.describe("Array of IDs (uuid) labels to assign to the task"),
	assigneeId: z
		.string()
		.nullable()
		.describe("ID of the user to assign the task to"),
	recurring: z
		.string()
		.nullable()
		.describe(
			"Cron expression for the task recurrence. If provided, the task will be set to recur based on this schedule.",
		),

	explanation: z
		.string()
		.describe(
			"Explanation of the decisions made for important fields. keep it concise.",
		),
});
