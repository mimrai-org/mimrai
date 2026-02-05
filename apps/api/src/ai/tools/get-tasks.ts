import { getTasks } from "@mimir/db/queries/tasks";
import { statusTypeEnum } from "@mimir/db/schema";
import { getAppUrl } from "@mimir/utils/envs";
import { getTaskPermalink } from "@mimir/utils/tasks";
import { tool } from "ai";
import z from "zod";
import type { AppContext } from "../agents/config/shared";

export const getTasksToolSchema = z.object({
	search: z.string().optional().describe("Search query"),
	assigneeId: z.array(z.string()).optional().describe("Users IDs (uuid)"),
	statusType: z
		.array(z.enum(statusTypeEnum.enumValues))
		.optional()
		.describe("Status type"),
	statusChangedAtBefore: z
		.string()
		.optional()
		.describe("Status changed before date in ISO format"),
	statusChangedAtAfter: z
		.string()
		.optional()
		.describe("Status changed after date in ISO format"),
	createdAtBefore: z
		.string()
		.optional()
		.describe("Created before date in ISO format"),
	createdAtAfter: z
		.string()
		.optional()
		.describe("Created after date in ISO format"),
	cursor: z.string().optional().describe("Pagination cursor"),
	pageSize: z.number().min(1).max(100).default(10).describe("Page size"),
});

export const getTasksTool = tool({
	description: "Retrieve a list of tasks",
	inputSchema: getTasksToolSchema,
	execute: async function* (
		{
			search,
			cursor,
			pageSize,
			assigneeId,
			statusType,
			createdAtAfter,
			createdAtBefore,
			statusChangedAtAfter,
			statusChangedAtBefore,
		},
		executionOptions,
	) {
		try {
			const { userId, teamId, teamSlug, writter } =
				executionOptions.experimental_context as AppContext;

			const statusChangedAt =
				statusChangedAtAfter && statusChangedAtBefore
					? [new Date(statusChangedAtAfter), new Date(statusChangedAtBefore)]
					: undefined;

			const createdAt =
				createdAtAfter && createdAtBefore
					? [new Date(createdAtAfter), new Date(createdAtBefore)]
					: undefined;

			const result = await getTasks({
				teamId: teamId,
				assigneeId: assigneeId,
				statusType,
				view: "board",
				cursor,
				pageSize,
				search,
				statusChangedAt,
				createdAt,
			});

			if (result.data.length === 0) {
				yield { type: "text", text: "No tasks found." };
				return;
			}

			const mappedData = result.data.map((task) => ({
				id: task.id,
				title: task.title,
				priority: task.priority,
				status: task.status,
				statusId: task.statusId,
				assigneeId: task.assigneeId,
				assigneeName: task.assignee?.name,
				dueDate: task.dueDate,
				createdAt: task.createdAt,
				updatedAt: task.updatedAt,
				sequence: task.sequence,
				dependencies: task.dependencies,
				statusChangedAt: task.statusChangedAt,
				completedByUserId: task.completedBy,
				taskUrl: getTaskPermalink(task.permalinkId),
			}));

			if (writter) {
				for (const task of mappedData.slice(0, 5)) {
					writter.write({
						type: "data-task",
						data: task,
					});
				}
			}

			yield mappedData;
		} catch (error) {
			console.error("Error in getTasksTool:", error);
			throw error;
		}
	},
});
