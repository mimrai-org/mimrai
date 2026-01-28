import { createTask } from "@mimir/db/queries/tasks";
import type { MimraiMcpServer } from "../server";
import type { McpContext } from "./build-mcp";
import { CreateTaskInputSchema, hasScope } from "./schemas";

export function registerCreateTaskTool(
	server: MimraiMcpServer,
	getContext: () => McpContext,
) {
	server.registerTool(
		"mimrai_create_task",
		{
			title: "Create Task",
			description: `Create a new task in the user's workspace.

Args:
  - title (string): Task title (required)
  - description (string): Task description in markdown format
  - assigneeId (string): User ID to assign the task to
  - statusId (string): Status ID for the task (required - use mimrai_list_statuses first)
  - projectId (string | null): Project ID to add the task to
  - milestoneId (string | null): Milestone ID to associate
  - priority ('low' | 'medium' | 'high' | 'urgent'): Task priority
  - dueDate (string): Due date in ISO 8601 format
  - labels (string[]): Array of label IDs to attach

Returns:
  The created task with its ID and details.

Requires scope: mimrai:tasks:write`,
			inputSchema: CreateTaskInputSchema,
			annotations: {
				readOnlyHint: false,
				destructiveHint: false,
				idempotentHint: false,
				openWorldHint: false,
			},
		},
		async (params) => {
			const ctx = getContext();

			if (!hasScope(ctx, "mimrai:tasks:write")) {
				return {
					content: [
						{
							type: "text",
							text: "Error: Missing required scope 'mimrai:tasks:write'",
						},
					],
					isError: true,
				};
			}

			try {
				const task = await createTask({
					title: params.title,
					description: params.description,
					assigneeId: params.assigneeId,
					statusId: params.statusId,
					projectId: params.projectId ?? null,
					milestoneId: params.milestoneId,
					priority: params.priority,
					dueDate: params.dueDate,
					labels: params.labels,
					teamId: ctx.teamId,
					userId: ctx.userId,
				});

				const output = {
					id: task.id,
					title: task.title,
					description: task.description,
					sequence: task.sequence,
					permalinkId: task.permalinkId,
					priority: task.priority,
					dueDate: task.dueDate,
					statusId: task.statusId,
					projectId: task.projectId,
					milestoneId: task.milestoneId,
					assigneeId: task.assigneeId,
					createdAt: task.createdAt,
				};

				return {
					content: [
						{
							type: "text",
							text: `Task created successfully:\n${JSON.stringify(output, null, 2)}`,
						},
					],
					structuredContent: output,
				};
			} catch (error) {
				return {
					content: [
						{
							type: "text",
							text: `Error creating task: ${error instanceof Error ? error.message : "Unknown error"}`,
						},
					],
					isError: true,
				};
			}
		},
	);
}
