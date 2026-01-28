import { updateTask } from "@mimir/db/queries/tasks";
import type { MimraiMcpServer } from "../server";
import type { McpContext } from "./build-mcp";
import { hasScope, UpdateTaskInputSchema } from "./schemas";

export function registerUpdateTaskTool(
	server: MimraiMcpServer,
	getContext: () => McpContext,
) {
	server.registerTool(
		"mimrai_update_task",
		{
			title: "Update Task",
			description: `Update an existing task in the user's workspace.

Args:
  - taskId (string): The task ID to update (required)
  - title (string): New task title
  - description (string): New task description in markdown format
  - assigneeId (string | null): User ID to assign (null to unassign)
  - statusId (string): New status ID for the task
  - projectId (string | null): Project ID to move to (null to remove)
  - milestoneId (string | null): Milestone ID to associate
  - priority ('low' | 'medium' | 'high' | 'urgent'): New task priority
  - dueDate (string): New due date in ISO 8601 format
  - labels (string[]): Array of label IDs (replaces existing)

Returns:
  The updated task with its details.

Requires scope: mimrai:tasks:write`,
			inputSchema: UpdateTaskInputSchema,
			annotations: {
				readOnlyHint: false,
				destructiveHint: false,
				idempotentHint: true,
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
				const { taskId, ...updateData } = params;

				const task = await updateTask({
					id: taskId,
					...updateData,
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
					updatedAt: task.updatedAt,
				};

				return {
					content: [
						{
							type: "text",
							text: `Task updated successfully:\n${JSON.stringify(output, null, 2)}`,
						},
					],
					structuredContent: output,
				};
			} catch (error) {
				return {
					content: [
						{
							type: "text",
							text: `Error updating task: ${error instanceof Error ? error.message : "Unknown error"}`,
						},
					],
					isError: true,
				};
			}
		},
	);
}
