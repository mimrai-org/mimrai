import { statusTypeEnum } from "@db/schema";
import { getTasks } from "@mimir/db/queries/tasks";
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
	cursor: z.string().optional().describe("Pagination cursor"),
	pageSize: z.number().min(1).max(100).default(10).describe("Page size"),
});

export const getTasksTool = tool({
	description: "Retrieve a list of tasks",
	inputSchema: getTasksToolSchema,
	execute: async function* (
		{ search, cursor, pageSize, assigneeId, statusType },
		executionOptions,
	) {
		try {
			const { userId, teamId, teamSlug } =
				executionOptions.experimental_context as AppContext;

			yield { text: "Fetching tasks...", status: "loading" };

			const result = await getTasks({
				teamId: teamId,
				assigneeId: assigneeId,
				statusType,
				view: "board",
				cursor,
				pageSize,
				search,
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
				taskUrl: getTaskPermalink(task.permalinkId),
			}));

			yield {
				boardUrl: `${getAppUrl()}/team/${teamSlug}/board`,
				data: mappedData,
			};
		} catch (error) {
			console.error("Error in getTasksTool:", error);
			throw error;
		}
	},
});
