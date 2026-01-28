import { getTasks } from "@mimir/db/queries/tasks";
import type { MimraiMcpServer } from "../server";
import type { McpContext } from "./build-mcp";
import { hasScope, ListTasksInputSchema, truncateText } from "./schemas";

export function registerListTasksTool(
	server: MimraiMcpServer,
	getContext: () => McpContext,
) {
	server.registerTool(
		"mimrai_list_tasks",
		{
			title: "List Tasks",
			description: `List and search tasks in the user's workspace.

This tool retrieves tasks with optional filtering by status, assignee, project, labels, and more.
Supports pagination for large result sets.

Args:
  - pageSize (number): Maximum tasks to return (1-100, default 20)
  - cursor (string): Pagination cursor from previous response
  - assigneeId (string[]): Filter by assignee user IDs
  - statusId (string[]): Filter by status IDs
  - statusType (string[]): Filter by status type (backlog, to_do, in_progress, done, canceled)
  - projectId (string[]): Filter by project IDs
  - milestoneId (string[]): Filter by milestone IDs
  - labels (string[]): Filter by label IDs
  - search (string): Search tasks by title or description

Returns:
  List of tasks with their details and pagination metadata.

Requires scope: mimrai:tasks:read`,
			inputSchema: ListTasksInputSchema,
			annotations: {
				readOnlyHint: true,
				destructiveHint: false,
				idempotentHint: true,
				openWorldHint: false,
			},
		},
		async (params) => {
			const ctx = getContext();

			if (!hasScope(ctx, "mimrai:tasks:read")) {
				return {
					content: [
						{
							type: "text",
							text: "Error: Missing required scope 'mimrai:tasks:read'",
						},
					],
					isError: true,
				};
			}

			try {
				const result = await getTasks({
					...params,
					teamId: ctx.teamId,
					userId: ctx.userId,
				});

				const output = {
					tasks: result.data.map((task) => ({
						id: task.id,
						title: task.title,
						description: task.description,
						sequence: task.sequence,
						permalinkId: task.permalinkId,
						priority: task.priority,
						dueDate: task.dueDate,
						status: task.status,
						assignee: task.assignee,
						project: task.project,
						milestone: task.milestone,
						labels: task.labels,
						createdAt: task.createdAt,
						updatedAt: task.updatedAt,
					})),
					pagination: {
						cursor: result.meta.cursor,
						hasNextPage: result.meta.hasNextPage,
						hasPreviousPage: result.meta.hasPreviousPage,
					},
				};

				let text: string;
				if (params.responseFormat === "markdown") {
					const taskList = output.tasks
						.map(
							(task) =>
								`- **${task.title}** (${task.id})\n  Status: ${task.status?.name || "Unknown"}, Assignee: ${task.assignee?.name || "Unassigned"}, Priority: ${task.priority || "None"}`,
						)
						.join("\n\n");
					text = `## Tasks\n\n${taskList}\n\n**Pagination:** ${output.pagination.hasNextPage ? "More tasks available" : "End of results"}`;
				} else {
					text = truncateText(JSON.stringify(output, null, 2));
				}

				return {
					content: [{ type: "text", text }],
					structuredContent: output,
				};
			} catch (error) {
				return {
					content: [
						{
							type: "text",
							text: `Error listing tasks: ${error instanceof Error ? error.message : "Unknown error"}`,
						},
					],
					isError: true,
				};
			}
		},
	);
}
