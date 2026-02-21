import { getTaskById, updateTask } from "@mimir/db/queries/tasks";
import { syncRecurringTaskSchedule } from "@mimir/jobs/tasks/create-recurring-task-job";
import { tool } from "ai";
import z from "zod";
import { getToolContext } from "../agents/config/shared";

export const updateTaskToolSchema = z.object({
	id: z.string().describe("Task ID to update"),
	title: z.string().min(1).optional().describe("Title"),
	description: z.string().optional().describe("Description, Markdown format"),
	dueDate: z.string().optional().describe("Due Date in ISO 8601 format"),
	assigneeId: z.string().optional().describe("User assignee ID"),
	statusId: z.string().optional().describe("Status ID"),
	milestoneId: z.string().optional().describe("Milestone ID"),
	projectId: z.string().optional().describe("Project ID"),

	attachments: z.array(z.url()).optional().describe("List of attachment URLs"),
	recurring: z
		.string()
		.optional()
		.describe(
			"Recurrence pattern in cron format (e.g. '0 9 * * 1' for every Monday at 9 AM)",
		),

	priority: z
		.enum(["low", "medium", "high", "urgent"])
		.optional()
		.describe("Priority level"),
});

export const updateTaskTool = tool({
	description:
		"Update a task, including title, description, due date, assignee, column, attachments, and priority",
	inputSchema: updateTaskToolSchema,
	execute: async function* (input, executionOptions) {
		try {
			const { userId, teamId } = getToolContext(executionOptions);

			const oldTask = await getTaskById(input.id, userId);
			const updatedTask = await updateTask({
				...input,
				id: input.id,
				teamId,
				userId,
			});

			const recurringChanged = oldTask.recurring !== updatedTask.recurring;
			const missingRecurringJob =
				Boolean(updatedTask.recurring) && !oldTask.recurringJobId;

			if (recurringChanged || missingRecurringJob) {
				await syncRecurringTaskSchedule({
					taskId: updatedTask.id,
					recurringCron: updatedTask.recurring ?? null,
					previousJobId: oldTask.recurringJobId,
				});
			}

			yield { type: "text", text: `Task updated: ${updatedTask.title}` };
		} catch (error) {
			yield {
				type: "text",
				text: "Error updating task, ensure you are providing valid IDs from others tools (e.g. getStatuses, getUsers, getMilestones, getProjects)",
			};
			console.error("Error updating task:", error);
		}
	},
});
