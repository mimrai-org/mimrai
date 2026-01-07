import { createTask } from "@db/queries/tasks";
import { trackTaskCreated } from "@mimir/events/server";
import { getTaskPermalink } from "@mimir/utils/tasks";
import { tool } from "ai";
import z from "zod";
import type { AppContext } from "../agents/config/shared";

export const createTaskToolSchema = z.object({
	title: z.string().min(1).describe("Title"),
	description: z
		.string()
		.optional()
		.describe("Description, HTML format supported"),
	assigneeId: z.string().optional().describe("User ID (uuid) of the assignee"),
	priority: z
		.enum(["low", "medium", "high", "urgent"])
		.optional()
		.describe("Priority"),
	dueDate: z.string().optional().describe("Due date in ISO format"),
	statusId: z
		.string()
		.describe("Status ID (uuid) representing the task status"),
	labelsIds: z
		.array(z.string())
		.optional()
		.describe("Array of label IDs (uuid) to be assigned to the task"),
	projectId: z.string().optional().describe("ID of the project (only uuid)"),
	milestoneId: z
		.string()
		.optional()
		.describe("ID of the milestone (only uuid)"),

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

			const newTask = await createTask({
				title: input.title,
				description: input.description,
				statusId: input.statusId,
				assigneeId: input.assigneeId || undefined,
				dueDate: input.dueDate
					? new Date(input.dueDate).toISOString()
					: undefined,
				priority: input.priority || "medium",
				projectId: input.projectId,
				milestoneId: input.milestoneId,
				teamId: teamId,
				attachments: input.attachments || [],
				labels: input.labelsIds || [],
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
