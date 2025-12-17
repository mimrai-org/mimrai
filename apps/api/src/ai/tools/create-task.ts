import { openai } from "@ai-sdk/openai";
import { getLabels } from "@db/queries/labels";
import { getStatuses } from "@db/queries/statuses";
import { createTask } from "@db/queries/tasks";
import { getMembers } from "@db/queries/teams";
import { trackTaskCreated } from "@mimir/events/server";
import { getTaskPermalink } from "@mimir/utils/tasks";
import { generateObject, tool } from "ai";
import z from "zod";
import type { AppContext } from "../agents/config/shared";

export const createTaskToolSchema = z.object({
	title: z.string().min(1).describe("Title"),
	description: z
		.string()
		.optional()
		.describe("Description, HTML format supported"),
	assignee: z.string().optional().describe("Name or email of the assignee"),
	priority: z
		.enum(["low", "medium", "high", "urgent"])
		.optional()
		.describe("Priority"),
	dueDate: z.string().optional().describe("Due date in ISO format"),
	column: z
		.string()
		.describe("Name of the column where the task should be created"),
	projectId: z.string().optional().describe("ID of the project (uuid)"),
	milestoneId: z.string().optional().describe("ID of the milestone (uuid)"),

	attachments: z
		.array(z.url())
		.optional()
		.describe("List of attachment URLs for the task"),
});

export const createTaskTool = tool({
	description: "Create a new task",
	inputSchema: createTaskToolSchema,
	execute: async function* (input, executionOptions) {
		try {
			const { userId, teamId, teamName } =
				executionOptions.experimental_context as AppContext;
			yield {
				text: `Creating task: ${input.title}`,
			};

			const columns = await getStatuses({
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
				model: openai("gpt-4o"),
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
				column: ${input.column || "not provided"}
				assignee: ${input.assignee || "not provided"}
				</input-variables>

				<column-rules>
					- If no context is provided to choose the column, default to the To Do column.
					- If the specified column does not exist, choose the most appropriate one based on the task title and description.
				</column-rules>
				<columns-options>
					${columns.data
						.map(
							(col) =>
								`- Name: ${col.name}, ID: ${col.id}, Type: ${col.type}, Description: ${col.description}`,
						)
						.join("\n")}
				</columns-options>

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
				temperature: 0.4,
			});

			const newTask = await createTask({
				title: input.title,
				description: input.description,
				statusId: result.object.statusId,
				assigneeId: result.object.assigneeId || undefined,
				dueDate: input.dueDate
					? new Date(input.dueDate).toISOString()
					: undefined,
				priority: input.priority || "medium",
				projectId: input.projectId,
				milestoneId: input.milestoneId,
				teamId: teamId,
				attachments: input.attachments || [],
				labels: result.object.labelsIds || [],
				userId: userId,
			});

			trackTaskCreated({
				userId: userId,
				teamId: teamId,
				teamName: teamName,
				source: "tool",
			});

			yield {
				type: "text",
				text: `Task created: ${newTask.title}`,
				taskLink: getTaskPermalink(newTask.permalinkId),
			};
		} catch (error) {
			console.error("Error creating task:", error);
			yield { type: "text", text: "Error creating task" };
		}
	},
});
