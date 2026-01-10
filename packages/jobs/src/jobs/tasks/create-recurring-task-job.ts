import { createTask, updateTaskRecurringJob } from "@mimir/db/queries/tasks";
import {
	checklistItems,
	labels,
	labelsOnTasks,
	statuses,
	tasks,
} from "@mimir/db/schema";
import { getNextTaskRecurrenceDate } from "@mimir/utils/recurrence";
import { logger, schemaTask } from "@trigger.dev/sdk";
import { and, desc, eq } from "drizzle-orm";
import z from "zod";
import { getDb } from "../../init";

export const createRecurringTaskJob = schemaTask({
	id: "create-recurring-task-job",
	schema: z.object({
		originalTaskId: z.string(),
	}),
	run: async (payload, { ctx }) => {
		const db = getDb();
		const [originalTask] = await db
			.select()
			.from(tasks)
			.where(eq(tasks.id, payload.originalTaskId));

		if (!originalTask) {
			logger.warn(`Original task with ID ${payload.originalTaskId} not found.`);
			return;
		}

		// If the job is scheduled, create the next occurrence
		if (originalTask.recurringJobId) {
			const [column] = await db
				.select()
				.from(statuses)
				.where(
					and(
						eq(statuses.teamId, originalTask.teamId),
						eq(statuses.type, "in_progress"),
					),
				)
				.orderBy(desc(statuses.order))
				.limit(1);

			if (!column) {
				logger.warn(
					`No in_progress column found for team ID ${originalTask.teamId}.`,
				);
				return;
			}

			const originalLabels = await db
				.select()
				.from(labelsOnTasks)
				.innerJoin(labels, eq(labels.id, labelsOnTasks.labelId))
				.where(and(eq(labelsOnTasks.taskId, originalTask.id)));

			const newTask = await createTask({
				title: originalTask.title,
				description: originalTask.description,
				assigneeId: originalTask.assigneeId,
				statusId: column.id,
				priority: originalTask.priority,
				labels: originalLabels.map((l) => l.labels.id),
				attachments: originalTask.attachments,
				teamId: originalTask.teamId,
				mentions: originalTask.mentions,
			});

			const originalChecklistItems = await db
				.select()
				.from(checklistItems)
				.where(eq(checklistItems.taskId, originalTask.id));

			for (const item of originalChecklistItems) {
				// Clean up the item object
				delete item.id;
				delete item.isCompleted;

				await db.insert(checklistItems).values({
					...item,
					taskId: newTask.id,
				});
			}

			logger.info(
				`Created recurring task with ID ${newTask.id} from original task ID ${originalTask.id}.`,
			);
		}

		// Schedule the next occurrence
		if (originalTask.recurring) {
			const isFirst = !originalTask.recurringJobId;

			// Calculate next occurrence date
			const nextDate = getNextTaskRecurrenceDate({
				currentDate: isFirst
					? originalTask.recurring.startDate
						? new Date(originalTask.recurring.startDate)
						: ctx.run.createdAt
					: ctx.run.createdAt,
				frequency: originalTask.recurring.frequency,
				interval: originalTask.recurring.interval,
			});

			const nextJob = await createRecurringTaskJob.trigger(
				{
					originalTaskId: originalTask.id,
				},
				{
					delay: nextDate,
				},
			);

			await updateTaskRecurringJob({
				taskId: originalTask.id,
				jobId: nextJob.id,
				nextOccurrenceDate: nextDate.toISOString(),
			});
		}
	},
});
