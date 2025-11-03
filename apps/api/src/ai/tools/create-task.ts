import { createTask } from "@db/queries/tasks";
import { getDuplicateTaskEmbedding } from "@db/queries/tasks-embeddings";
import { getTaskUrl } from "@mimir/utils/tasks";
import { tool } from "ai";
import z from "zod";
import { getContext } from "../context";

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
	assigneeId: z
		.string()
		.optional()
		.describe(
			"ID of the user to assign the task to. Try to assign it to someone if possible guessing from the users description from the getUsers tool output, do not ask if not provided",
		),
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
	columnId: z
		.string()
		.describe(
			"ID of the column to add the task to, do not ask, get it from the getColumns tool",
		),
	labels: z
		.array(z.string())
		.optional()
		.describe(
			"List of label IDs to assign to the task. Do not ask, get it from the getLabels tool always (it is used to categorize and filter tasks)",
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
			"Whether to force the creation of the task even if a similar one exists. Default is false.",
		),
});

export const createTaskTool = tool({
	description:
		"Create a new task in your board. Always call the getUsers, getLabels, getColumns tools before using this tool to get the IDs needed for assigneeId, columnId and labels",
	inputSchema: createTaskToolSchema,
	execute: async function* (input) {
		try {
			const { db, user, artifactSupport } = getContext();

			yield { text: `Creating task: ${input.title}` };

			if (!input.forceCreate) {
				const [taskExist] = await getDuplicateTaskEmbedding({
					task: {
						title: input.title,
						description: input.description,
					},
					teamId: user.teamId,
					threshold: 0.9,
				});

				if (taskExist) {
					yield {
						type: "text",
						text: `A similar task already exists: ${taskExist.title}`,
						suggestion:
							"Think about creating a subtask or updating the existing one.",
						taskId: taskExist.id,
						taskLink: getTaskUrl(taskExist.id),
					};
					return;
				}
			}

			const newTask = await createTask({
				title: input.title,
				description: input.description,
				columnId: input.columnId,
				assigneeId: input.assigneeId,
				dueDate: input.dueDate
					? new Date(input.dueDate).toISOString()
					: undefined,
				priority: input.priority || "medium",
				teamId: user.teamId,
				attachments: input.attachments || [],
				labels: input.labels || [],
				userId: user.userId,
			});

			yield {
				type: "text",
				text: `Task created: ${newTask.title}`,
				taskLink: getTaskUrl(newTask.id),
			};
		} catch (error) {
			console.error("Error creating task:", error);
			yield { type: "text", text: "Error creating task" };
		}
	},
});
