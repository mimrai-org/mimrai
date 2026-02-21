import { createTask } from "@mimir/db/queries/tasks";
import { checklistItems, labelsOnTasks, tasks } from "@mimir/db/schema";
import { logger, schemaTask } from "@trigger.dev/sdk";
import { and, eq } from "drizzle-orm";
import z from "zod";
import { getDb } from "../../init";

export const createTaskFromTemplateJob = schemaTask({
	id: "create-task-from-template-job",
	schema: z.object({
		templateTaskId: z.string(),
		teamId: z.string(),
		source: z.enum(["system", "db"]),
		triggerType: z.string(),
	}),
	run: async (payload) => {
		const db = getDb();

		const [templateTask] = await db
			.select()
			.from(tasks)
			.where(
				and(
					eq(tasks.id, payload.templateTaskId),
					eq(tasks.teamId, payload.teamId),
					eq(tasks.isTemplate, true),
				),
			)
			.limit(1);

		if (!templateTask) {
			logger.warn(
				`Template task ${payload.templateTaskId} not found for team ${payload.teamId}.`,
			);
			return;
		}

		const templateLabels = await db
			.select({ labelId: labelsOnTasks.labelId })
			.from(labelsOnTasks)
			.where(eq(labelsOnTasks.taskId, templateTask.id));

		const task = await createTask({
			title: templateTask.title,
			description: templateTask.description,
			assigneeId: templateTask.assigneeId,
			statusId: templateTask.statusId,
			priority: templateTask.priority,
			labels: templateLabels.map((label) => label.labelId),
			attachments: templateTask.attachments,
			teamId: templateTask.teamId,
			projectId: templateTask.projectId,
			milestoneId: templateTask.milestoneId,
			repositoryName: templateTask.repositoryName,
			branchName: templateTask.branchName,
			dueDate: templateTask.dueDate,
			mentions: templateTask.mentions,
			isTemplate: false,
			triggerId: null,
			recurring: null,
		});

		const templateChecklistItems = await db
			.select()
			.from(checklistItems)
			.where(eq(checklistItems.taskId, templateTask.id));

		for (const checklistItem of templateChecklistItems) {
			await db.insert(checklistItems).values({
				taskId: task.id,
				description: checklistItem.description,
				isCompleted: false,
				assigneeId: checklistItem.assigneeId,
				teamId: checklistItem.teamId,
				attachments: checklistItem.attachments,
			});
		}

		logger.info(
			`Instantiated task ${task.id} from template ${templateTask.id} (${payload.source}:${payload.triggerType}).`,
		);
	},
});
