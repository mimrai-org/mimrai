import { openai } from "@ai-sdk/openai";
import { getLabels } from "@mimir/db/queries/labels";
import { getProjects } from "@mimir/db/queries/projects";
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

	const projects = await getProjects({
		teamId: team.id,
		pageSize: 20,
	});

	const labels = await getLabels({
		teamId: team.id,
		pageSize: 50,
	});

	const response = await generateObject({
		model: openai("gpt-4o-mini"),
		system: `
IMPORTANT: Follow the guidelines strictly. Do not make any assumptions outside of the provided context. And do not make up any data.
<guidelines>
- If no tasks are found, return an empty list.
- Ensure tasks are actionable and clearly defined.
- Use the team context to better understand roles and responsibilities.
- Prioritize tasks based on urgency and importance inferred from the email content.
- Ensure each task is associated with a project from the provided projects list. Use the project ID for the projectId field.
- Ensure the assigneeId corresponds to a valid team member ID from the provided members list.
- If no suitable assignee is found, leave the assigneeId field undefined.
- Set due dates based on any temporal references in the email. If no due date is mentioned, leave the dueDate field undefined.
- Assign priority levels (low, medium, high, urgent) based on the tone and content of the email. If no clear priority can be inferred, set it to medium.
- Assign relevant labels to each task based on the email content and the provided labels list. Use the label IDs for the labels field.
- The tasks array has no maximum length, extract as many tasks as are relevant from the email content.
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
	description: "${member.description || "None"}"
`,
	)
	.join("\n")}
</members>

<projects>
${projects.data
	.map(
		(project) => `
- id: ${project.id}
	name: ${project.name}
	description: "${project.description || "None"}"
`,
	)
	.join("\n")}
</projects>
<labels>
${labels
	.map(
		(label) => `
- id: ${label.id}
	name: ${label.name}
	description: "${label.description || "None"}"
`,
	)
	.join("\n")}
</labels>
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
	tasks: z.array(
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
			projectId: z.string().describe("Project ID to which the task belongs"),
			labels: z
				.array(z.string())
				.optional()
				.describe("Labels IDs associated with the task"),
		}),
	),
});
