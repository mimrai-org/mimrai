import { getColumns } from "@db/queries/columns";
import { getLabels } from "@db/queries/labels";
import { createTask } from "@db/queries/tasks";
import { getDuplicateTaskEmbedding } from "@db/queries/tasks-embeddings";
import { getMembers } from "@db/queries/teams";
import { getTaskUrl } from "@mimir/utils/tasks";
import { generateObject, tool } from "ai";
import z from "zod";
import type { AppContext } from "../agents/config/shared";

export const createTaskToolSchema = z.object({
	title: z
		.string()
		.min(1)
		.describe(
			"Title of the task, do not ask if not provided, generate if not provided",
		),
	description: z
		.string()
		.optional()
		.describe(
			"Description of the task, do not ask if not provided, generate if not provided",
		),
	assignee: z
		.string()
		.optional()
		.describe("Name or email of the assignee, do not ask if not provided"),
	priority: z
		.enum(["low", "medium", "high", "urgent"])
		.optional()
		.describe(
			"Priority of the task, can be low, medium or high, do not ask if not provided, evaluate from the title and description if possible",
		),
	dueDate: z
		.string()
		.optional()
		.describe("ISO date string, do not ask if not provided"),
	column: z
		.string()
		.describe(
			"Name of the column where the task should be created, do not ask if not provided.",
		),

	attachments: z
		.array(z.url())
		.optional()
		.describe(
			"List of attachment URLs for the task, only provide if you want to add attachments",
		),

	forceCreate: z
		.boolean()
		.optional()
		.describe(
			"If you already asked for confirmation about duplicate tasks and the user wants to create a new one, set this to true to force creation",
		),
});

export const createTaskTool = tool({
	description: "Create a new task",
	inputSchema: createTaskToolSchema,
	execute: async function* (input, executionOptions) {
		try {
			const { userId, teamId } =
				executionOptions.experimental_context as AppContext;
			yield {
				text: `Creating task: ${input.title}`,
			};

			if (!input.forceCreate) {
				const [taskExist] = await getDuplicateTaskEmbedding({
					task: {
						title: input.title,
						description: input.description,
					},
					teamId: teamId,
					threshold: 0.9,
				});

				if (taskExist) {
					yield {
						type: "text",
						text: `A similar task already exists: ${taskExist.title}`,
						suggestion:
							"Think about creating a subtask or updating the existing one.",
						taskId: taskExist.id,
						taskLink: getTaskUrl(taskExist.id, teamId),
					};
					return;
				}
			}

			const columns = await getColumns({
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
				model: "gpt-4o-mini",
				schema: z.object({
					assigneeId: z
						.string()
						.optional()
						.describe(
							"ID of the user to assign the task to, leave empty if no suitable assignee is found",
						),
					columnId: z
						.string()
						.describe("ID of the column where the task should be created"),
					labelsIds: z
						.array(z.string())
						.optional()
						.describe(
							"List of label IDs to assign to the task, leave empty if no labels are suitable",
						),
				}),
				prompt: `Based on the following options, provide the assignee ID and column ID for the new task.

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
				<possible-columns>
					${JSON.stringify(
						columns.data.map((col) => ({
							name: col.name,
							id: col.id,
							type: col.type,
							description: col.description,
						})),
					)}
				</possible-columns>
				
				<assignee-rules>
					- If no assignee is specified, try to assign the task to the team member who best fits the task based on their name, email, and description.
					- If no suitable assignee is found, use the current user as the assignee.
					- If the specified assignee does not exist, leave the assigneeId empty.
				</assignee-rules>
				<possible-assignees>
					${JSON.stringify(
						members.map((member) => ({
							name: member.name,
							email: member.email,
							description: member.description,
							id: member.id,
						})),
					)}
				</possible-assignees>

				<labels-rules>
					- Use the task title and description to determine the most relevant labels.
					- If no labels are relevant, leave the labelsIds array empty.
				</labels-rules>
				<possible-labels>
					${JSON.stringify(
						labels.map((label) => ({
							name: label.name,
							id: label.id,
							description: label.description,
						})),
					)}
				</possible-labels>
				`,
				temperature: 0.4,
			});

			const newTask = await createTask({
				title: input.title,
				description: input.description,
				columnId: result.object.columnId,
				assigneeId: result.object.assigneeId || undefined,
				dueDate: input.dueDate
					? new Date(input.dueDate).toISOString()
					: undefined,
				priority: input.priority || "medium",
				teamId: teamId,
				attachments: input.attachments || [],
				labels: result.object.labelsIds || [],
				userId: userId,
			});

			yield {
				type: "text",
				text: `Task created: ${newTask.title}`,
				taskLink: getTaskUrl(newTask.id, newTask.teamId),
			};
		} catch (error) {
			console.error("Error creating task:", error);
			yield { type: "text", text: "Error creating task" };
		}
	},
});
