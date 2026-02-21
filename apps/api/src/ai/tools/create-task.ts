import { createTask } from "@mimir/db/queries/tasks";
import { trackTaskCreated } from "@mimir/events/server";
import { syncRecurringTaskSchedule } from "@mimir/jobs/tasks/create-recurring-task-job";
import { getTaskPermalink } from "@mimir/utils/tasks";
import { tool } from "ai";
import z from "zod";
import { getToolContext } from "../agents/config/shared";

export const createTaskToolSchema = z.object({
	title: z.string().min(1).describe("Title"),
	description: z.string().optional().describe("Description, Markdown format"),
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
	projectId: z.string().describe("ID of the project (only uuid)"),
	milestoneId: z
		.string()
		.optional()
		.describe("ID of the milestone (only uuid)"),

	attachments: z
		.array(z.url())
		.optional()
		.describe("List of attachment URLs for the task"),

	recurring: z
		.string()
		.optional()
		.describe(
			"Recurrence pattern in cron format (e.g. '0 9 * * 1' for every Monday at 9 AM)",
		),
	isTemplate: z
		.boolean()
		.optional()
		.describe("Whether this task is a template for future tasks"),
});

export const createTaskTool = tool({
	description: "Create a new task",
	inputSchema: createTaskToolSchema,
	execute: async function* (input, executionOptions) {
		try {
			const { userId, teamId, teamName, writer } =
				getToolContext(executionOptions);

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
				recurring: input.recurring,
				isTemplate: input.isTemplate,
				userId: userId,
			});

			if (input.recurring) {
				await syncRecurringTaskSchedule({
					taskId: newTask.id,
					recurringCron: input.recurring,
				});
			}

			if (writer) {
				writer.write({
					type: "data-task",
					data: newTask,
				});
			}

			trackTaskCreated({
				userId: userId,
				teamId: teamId,
				teamName: teamName,
				source: "tool",
			});

			yield {
				id: newTask.id,
			};
		} catch (error) {
			console.error("Error creating task:", error);
			yield {
				type: "text",
				text: "Error creating task, ensure you are providing valid IDs from others tools (e.g. getStatuses, getUsers, getMilestones, getProjects)",
			};
		}
	},
});
