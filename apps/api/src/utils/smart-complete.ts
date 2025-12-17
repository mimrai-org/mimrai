import { getUserContext } from "@api/ai/utils/get-user-context";
import { TZDate } from "@date-fns/tz";
import { getSmartCompleteContext } from "@db/queries/tasks";
import { priorityEnum } from "@db/schema";
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

	return `You are the responsible for generating task details based on a user's prompt. Use the context provided to you to generate the most accurate and relevant task details possible.

<rules>
- Keep the title concise and self-explanatory.
- The description should provide enough detail for someone to understand the task without further clarification.
- If the user prompt lacks clarity, use the context to fill in the gaps.
- Be careful when assigning projects; only assign if the user prompt specifies it.
- If the user prompt is less than 4 words, use it as the title and do not generate a description unless there is relevant context.
- return dates in UTC ISO 8601 format.
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
	description: z
		.string()
		.max(50_000)
		.optional()
		.describe("Detailed description of the task"),
	priority: z
		.enum(priorityEnum.enumValues)
		.optional()
		.describe("Priority of the task"),
	dueDate: z
		.string()
		.optional()
		.describe("Due date of the task in ISO 8601 format"),
	labels: z
		.array(z.string())
		.optional()
		.describe("Array of IDs (uuid) labels to assign to the task"),
	assigneeId: z
		.string()
		.optional()
		.describe("ID of the user to assign the task to"),
	projectId: z
		.string()
		.optional()
		.describe("ID (uuid) of the project to assign the task to"),
	recurring: z
		.object({
			frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
			interval: z.coerce.number().min(1).max(12),
			startDate: z.string().optional(),
		})
		.optional()
		.nullable()
		.describe(
			"Recurrence settings for the task. If provided, the task will be set to recur based on these settings.",
		),

	explanation: z
		.string()
		.describe(
			"Explanation of the decisions made for important fields. keep it concise.",
		),
});
