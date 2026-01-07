import { openai } from "@ai-sdk/openai";
import { getMembers, getTeamById } from "@mimir/db/queries/teams";
import { generateObject } from "ai";
import z from "zod";
import type { DecodedEmail } from "./decode";

export const processEmail = async ({
	decodedEmail,
	teamId,
}: {
	decodedEmail: DecodedEmail;
	teamId: string;
}) => {
	const team = await getTeamById(teamId);
	if (!team) {
		throw new Error("Team not found");
	}

	const members = await getMembers({
		teamId: team.id,
	});

	const response = await generateObject({
		model: openai("gpt-4o-mini"),
		system: `
<guidelines>
- Extract the assignee if suffient information is present in the email content or deduce it from the team members list based on their descriptions. Use their user ID to set the assigneeId.
- If no tasks are found, return an empty list.
- Ensure tasks are actionable and clearly defined.
- Use the team context to better understand roles and responsibilities.
- Prioritize tasks based on urgency and importance inferred from the email content.
- Analyze the email to identify if it is noise or spam (e.g., promotional emails, irrelevant content to the team). If so, do not extract any tasks and return an empty list.
</guidelines>

<team-context>
name: ${team.name}
timezone: ${team.timezone || "UTC"}
locale: ${team.locale || "en"}

<description>
${team.description || "None"}
</description>

<members>
${members
	.map(
		(member) => `
- id: ${member.id}
	name: ${member.name}
	email: ${member.email}
	description: "${member.description || "None"}"
`,
	)
	.join("\n")}
</members>
</team-context>
		`,
		prompt: `Extract tasks information from the following email content. 

<email>
<subject>${decodedEmail.subject}</subject>
<body>${decodedEmail.body}</body>
</email>
      `,
		schema,
	});
	return response;
};

const schema = z.object({
	tasksPayload: z.array(
		z.object({
			title: z.string().describe("Title of the task"),
			description: z.string().describe("Description of the task"),
			reasoning: z.string().describe("Reasoning behind the task extraction"),
			assigneeId: z
				.string()
				.optional()
				.describe("User ID of the assignee If any"),
			dueDate: z
				.string()
				.optional()
				.describe("Due date of the task (ISO 8601 format)"),
			priority: z
				.enum(["low", "medium", "high", "urgent"])
				.optional()
				.describe("Priority of the task"),
		}),
	),
});
