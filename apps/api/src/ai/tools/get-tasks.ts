import { getTasks } from "@mimir/db/queries/tasks";
import { getAppUrl } from "@mimir/utils/envs";
import { getTaskUrl } from "@mimir/utils/tasks";
import { tool } from "ai";
import z from "zod";
import type { AppContext } from "../agents/config/shared";
import { taskFiltersArtifact } from "../artifacts/task-filters";

export const getTasksToolSchema = z.object({
	search: z
		.string()
		.optional()
		.describe(
			"Prefer searching by task sequence to find a specific task. Use keywords otherwise",
		),
	assigneeId: z
		.array(z.string())
		.optional()
		.describe("List of user IDs to filter tasks assigned to these users"),
	cursor: z
		.string()
		.optional()
		.describe(
			"Cursor for pagination, representing the last item from the previous page",
		),
	pageSize: z
		.number()
		.min(1)
		.max(25)
		.default(10)
		.describe("Number of transactions to return per page (1-25)"),
});

export const getTasksTool = tool({
	description:
		"Retrieve a list of tasks. Supports pagination. If the user wants to know more about a specific task use the sequence number to search for it.",
	inputSchema: getTasksToolSchema,
	execute: async function* (
		{ search, cursor, pageSize, assigneeId },
		executionOptions,
	) {
		try {
			const { userId, teamId } =
				executionOptions.experimental_context as AppContext;

			yield { text: "Fetching tasks...", status: "loading" };

			const result = await getTasks({
				teamId: teamId,
				assigneeId: assigneeId,
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
				description: task.description,
				priority: task.priority,
				column: task.column,
				columnId: task.columnId,
				assigneeId: task.assigneeId,
				dueDate: task.dueDate,
				createdAt: task.createdAt,
				updatedAt: task.updatedAt,
				sequence: task.sequence,
				taskUrl: getTaskUrl(task.id, task.teamId),
			}));

			yield {
				boardUrl: `${getAppUrl()}/dashboard`,
				data: mappedData,
			};
		} catch (error) {
			console.error("Error in getTasksTool:", error);
			throw error;
		}
	},
});
