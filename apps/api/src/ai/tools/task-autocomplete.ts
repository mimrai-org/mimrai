import { openai } from "@ai-sdk/openai";
import { getLabels } from "@mimir/db/queries/labels";
import { getStatuses } from "@mimir/db/queries/statuses";
import { getMembers } from "@mimir/db/queries/teams";
import { generateObject, tool } from "ai";
import z from "zod";
import { getToolContext } from "../agents/config/shared";

export const taskAutocompleteTool = tool({
	description:
		"Autocomplete task details like Assignee, status and labels based on partial input.",
	inputSchema: z.object({
		title: z.string().min(1).describe("Title of the task"),
		description: z.string().optional().describe("Description of the task"),
		assignee: z.string().optional().describe("Name or email of the assignee"),
		priority: z
			.enum(["low", "medium", "high", "urgent"])
			.optional()
			.describe("Priority of the task"),
		dueDate: z.string().optional().describe("Due date in ISO format"),
		status: z
			.string()
			.optional()
			.describe("Name of the status/column of the task"),
	}),
	outputSchema: z.object({
		assigneeId: z
			.string()
			.optional()
			.describe("User ID (uuid) of the assignee"),
		statusId: z
			.string()
			.describe("Status ID (uuid) where the task will be created"),
		labelsIds: z
			.array(z.string())
			.optional()
			.describe("Array of label IDs (uuid) to be assigned to the task"),
	}),
	execute: async function* (input, executionOptions) {
		const { teamId } = getToolContext(executionOptions);
		const statuses = await getStatuses({
			pageSize: 10,
			teamId: teamId,
		});

		const members = await getMembers({
			teamId: teamId,
		});

		const labels = await getLabels({
			teamId: teamId,
		});

		const result = await generateObject({
			model: openai("gpt-4o-mini"),
			schema: z.object({
				assigneeId: z
					.string()
					.optional()
					.describe("User ID (uuid) of the assignee"),
				statusId: z
					.string()
					.describe("Status ID (uuid) where the task will be created"),
				labelsIds: z
					.array(z.string())
					.optional()
					.describe("Array of label IDs (uuid) to be assigned to the task"),
			}),
			prompt: `Based on the following options, provide the assignee ID, column ID and labels IDs for the new task.

				<guidelines>
					- Always try to assign the most relevant column, assignee and labels based on the input.
					- Only provide the IDs as per the possible options provided.
				</guidelines>

				<input-variables>
				title: ${input.title}
				description: ${input.description || "not provided"}
				status: ${input.status || "not provided"}
				assignee: ${input.assignee || "not provided"}
				</input-variables>

				<status-rules>
					- If no context is provided to choose the status, default to the To Do status.
					- If the specified status does not exist, choose the most appropriate one based on the task title and description.
				</status-rules>
				<status-options>
					${statuses.data
						.map(
							(status) =>
								`- Name: ${status.name}, ID: ${status.id}, Type: ${status.type}, Description: ${status.description}`,
						)
						.join("\n")}
				</status-options>

				<assignee-rules>
					- If no assignee is specified, try to assign the task to the team member who best fits the task based on their name, email, and description.
					- If no suitable assignee is found, use the current user as the assignee.
					- If the specified assignee does not exist, leave the assigneeId empty.
				</assignee-rules>
				<assignees-options>
					${members
						.map(
							(member) =>
								`- Name: ${member.name}, Email: ${member.email}, Description: ${member.description}, ID: ${member.id}`,
						)
						.join("\n")}
				</assignees-options>

				<labels-rules>
					- Use the task title and description to determine the most relevant labels.
					- If no labels are relevant, leave the labelsIds array empty.
				</labels-rules>
				<labels-options>
					${labels
						.map(
							(label) =>
								`- Name: ${label.name}, ID: ${label.id}, Description: ${label.description}`,
						)
						.join("\n")}
				</labels-options>
				`,
			temperature: 0,
		});

		yield {
			...result.object,
		};
	},
});
