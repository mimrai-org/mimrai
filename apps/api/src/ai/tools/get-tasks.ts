import { getTasks } from "@mimir/db/queries/tasks";
import { getAppUrl } from "@mimir/utils/envs";
import { getTaskPermalink } from "@mimir/utils/tasks";
import { tool } from "ai";
import z from "zod";
import { taskFiltersArtifact } from "../artifacts/task-filters";
import { getContext } from "../context";

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
	execute: async function* ({ search, cursor, pageSize, assigneeId }) {
		try {
			const { user, artifactSupport } = getContext();

			yield { text: "Fetching tasks...", status: "loading" };

			if (artifactSupport && [search, assigneeId].filter(Boolean).length > 0) {
				const taskFilters = taskFiltersArtifact.stream({
					search,
					assigneeId,
				});
				taskFilters.complete();
			}

			const result = await getTasks({
				teamId: user.teamId,
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
				taskUrl: getTaskPermalink(task.permalinkId),
			}));

			yield {
				text: "I've applied the task filters you provided. You can view the filtered tasks in your board.",
				boardUrl: `${getAppUrl()}/dashboard`,
				status: "success",
				data: mappedData,
			};
		} catch (error) {
			console.error("Error in getTasksTool:", error);
			throw error;
		}
	},
});
