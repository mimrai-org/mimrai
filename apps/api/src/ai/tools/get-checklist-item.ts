import { db } from "@mimir/db/client";
import { checklistItems, tasks } from "@mimir/db/schema";
import { getTaskPermalink } from "@mimir/utils/tasks";
import { tool } from "ai";
import { and, eq } from "drizzle-orm";
import z from "zod";
import { getToolContext } from "../agents/config/shared";

export const getChecklistItemsSchema = z.object({
	taskId: z.string().describe("Tasks ID"),
});

export const getChecklistItemsTool = tool({
	description: "Retrieve checklist items for a specific task.",
	inputSchema: getChecklistItemsSchema,
	execute: async function* (input, executionOptions) {
		const { userId, teamId } = getToolContext(executionOptions);

		const [task] = await db
			.select()
			.from(tasks)
			.where(and(eq(tasks.id, input.taskId), eq(tasks.teamId, teamId)));

		if (!task) {
			yield {
				text: "No task found in your team.",
			};
			return;
		}

		yield { text: "Retrieving subtasks..." };

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
					eq(checklistItems.teamId, teamId),
				),
			);

		yield {
			text: `Found ${data.length} subtasks.`,
			taskUrl: getTaskPermalink(task.permalinkId),
			data,
		};
	},
});
