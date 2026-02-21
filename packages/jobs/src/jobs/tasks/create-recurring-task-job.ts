import { createTask, updateTaskRecurringJob } from "@mimir/db/queries/tasks";
import {
	checklistItems,
	labelsOnTasks,
	statuses,
	tasks,
} from "@mimir/db/schema";
import { getNextTaskRecurrenceDate } from "@mimir/utils/recurrence";
import { logger, runs, schemaTask } from "@trigger.dev/sdk";
import { and, desc, eq } from "drizzle-orm";
import z from "zod";
import { getDb } from "../../init";

const getValidReferenceDate = (referenceDate?: Date): Date => {
	if (!referenceDate || Number.isNaN(referenceDate.getTime())) {
		return new Date();
	}
	return referenceDate;
};

const cancelRecurringRun = async ({
	taskId,
	jobId,
}: {
	taskId: string;
	jobId: string;
}) => {
	try {
		await runs.cancel(jobId);
	} catch (error) {
		logger.warn(
			`Failed to cancel recurring job with ID ${jobId} for task ID ${taskId}.`,
			{
				error,
			},
		);
	}
};

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

		if (!originalTask.recurring) {
			if (originalTask.recurringJobId === ctx.run.id) {
				await updateTaskRecurringJob({
					taskId: originalTask.id,
					jobId: null,
					nextOccurrenceDate: null,
				});
			}
			return;
		}

		if (originalTask.recurringJobId !== ctx.run.id) {
			logger.info(
				`Skipping stale recurring run ${ctx.run.id} for task ${originalTask.id}. Current run is ${originalTask.recurringJobId}.`,
			);
			return;
		}

		const [column] = await db
			.select()
			.from(statuses)
			.where(
				and(
					eq(statuses.teamId, originalTask.teamId),
					eq(statuses.type, "to_do"),
				),
			)
			.orderBy(desc(statuses.order))
			.limit(1);

		const originalLabels = await db
			.select({ labelId: labelsOnTasks.labelId })
			.from(labelsOnTasks)
			.where(eq(labelsOnTasks.taskId, originalTask.id));

		const newTask = await createTask({
			title: originalTask.title,
			description: originalTask.description,
			assigneeId: originalTask.assigneeId,
			statusId: column?.id ?? originalTask.statusId,
			priority: originalTask.priority,
			labels: originalLabels.map((label) => label.labelId),
			attachments: originalTask.attachments,
			teamId: originalTask.teamId,
			projectId: originalTask.projectId,
			milestoneId: originalTask.milestoneId,
			repositoryName: originalTask.repositoryName,
			branchName: originalTask.branchName,
			mentions: originalTask.mentions,
			isTemplate: false,
			triggerId: null,
			recurring: null,
		});

		const originalChecklistItems = await db
			.select()
			.from(checklistItems)
			.where(eq(checklistItems.taskId, originalTask.id));

		if (originalChecklistItems.length > 0) {
			await db.insert(checklistItems).values(
				originalChecklistItems.map((item) => ({
					taskId: newTask.id,
					description: item.description,
					isCompleted: false,
					order: item.order,
					assigneeId: item.assigneeId,
					teamId: item.teamId,
					attachments: item.attachments,
				})),
			);
		}

		logger.info(
			`Created recurring task with ID ${newTask.id} from original task ID ${originalTask.id}.`,
		);

		await syncRecurringTaskSchedule({
			taskId: originalTask.id,
			recurringCron: originalTask.recurring,
			referenceDate: originalTask.recurringNextDate
				? new Date(originalTask.recurringNextDate)
				: undefined,
		});
	},
});

export const syncRecurringTaskSchedule = async ({
	taskId,
	recurringCron,
	previousJobId,
	referenceDate,
}: {
	taskId: string;
	recurringCron: string | null;
	previousJobId?: string | null;
	referenceDate?: Date;
}) => {
	if (previousJobId) {
		await cancelRecurringRun({ taskId, jobId: previousJobId });
	}

	if (!recurringCron) {
		await updateTaskRecurringJob({
			taskId,
			jobId: null,
			nextOccurrenceDate: null,
		});
		return null;
	}

	const nextDate = getNextTaskRecurrenceDate({
		currentDate: getValidReferenceDate(referenceDate),
		cronExpression: recurringCron,
	});

	const nextJob = await createRecurringTaskJob.trigger(
		{
			originalTaskId: taskId,
		},
		{
			delay: nextDate,
			idempotencyKey: `recurring-task-${taskId}-${nextDate.toISOString()}`,
		},
	);

	await updateTaskRecurringJob({
		taskId,
		jobId: nextJob.id,
		nextOccurrenceDate: nextDate.toISOString(),
	});

	return nextJob;
};
