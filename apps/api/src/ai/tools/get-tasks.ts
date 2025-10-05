import { getAppUrl } from "@mimir/utils/envs";
import { tool } from "ai";
import z from "zod";
import { getTasks } from "@/db/queries/tasks";
import { taskArtifact, tasksListArtifact } from "../artifacts/task";
import { taskFiltersArtifact } from "../artifacts/task-filters";
import { getContext } from "../context";

export const getTasksToolSchema = z.object({
	search: z
		.string()
		.optional()
		.describe("Partial title of the task to filter by"),
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
	description: "Retrieve a list of tasks. Supports pagination.",
	inputSchema: getTasksToolSchema,
	execute: async function* ({ search, cursor, pageSize, assigneeId }) {
		try {
			const { user, artifactSupport, writer } = getContext();

			yield { text: "Fetching tasks...", status: "loading" };
			const taskFilters = taskFiltersArtifact.stream({
				search,
				assigneeId,
			});
			taskFilters.complete();

			const result = await getTasks({
				teamId: user.teamId,
				assigneeId: assigneeId,
				cursor,
				pageSize,
				search,
			});

			if (result.data.length === 0) {
				yield { type: "text", text: "No tasks found." };
				return;
			}

			yield {
				text: "I've applied the task filters you provided. You can view the filtered tasks in your board.",
				link: `${getAppUrl()}/dashboard`,
				status: "success",
				data: result.data,
				forceStop: artifactSupport,
			};
		} catch (error) {
			console.error("Error in getTasksTool:", error);
			throw error;
		}
	},
});
