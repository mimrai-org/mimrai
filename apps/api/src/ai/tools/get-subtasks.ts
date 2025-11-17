import { checklistItems, tasks } from "@db/schema";
import { getTaskPermalink } from "@mimir/utils/tasks";
import { tool } from "ai";
import { and, eq } from "drizzle-orm";
import z from "zod";
import { getContext } from "../context";

export const getSubtasksToolSchema = z.object({
	taskId: z.string(),
});

export const getSubtasksTool = tool({
	description: "Get subtasks for a specific task",
	inputSchema: getSubtasksToolSchema,
	execute: async function* (input) {
		const { db, user } = getContext();

		yield { text: "Retrieving subtasks..." };

		const [task] = await db
			.select()
			.from(tasks)
			.where(eq(tasks.id, input.taskId))
			.limit(1);

		if (!task) {
			yield {
				text: `No task found with ID ${input.taskId}.`,
			};
			return;
		}

		const data = await db
			.select({
				id: checklistItems.id,
				description: checklistItems.description,
				isCompleted: checklistItems.isCompleted,
				assigneeId: checklistItems.assigneeId,
			})
			.from(checklistItems)
			.where(
				and(
					eq(checklistItems.taskId, input.taskId),
					eq(checklistItems.teamId, user.teamId),
				),
			);

		yield {
			text: `Found ${data.length} subtasks.`,
			taskUrl: getTaskPermalink(task.permalinkId),
			data,
		};
	},
});
