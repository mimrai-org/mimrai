import { deleteTask } from "@mimir/db/queries/tasks";
import type { MimraiMcpServer } from "../server";
import type { McpContext } from "./build-mcp";
import { DeleteTaskInputSchema, hasScope } from "./schemas";

export function registerDeleteTaskTool(
	server: MimraiMcpServer,
	getContext: () => McpContext,
) {
	server.registerTool(
		"mimrai_delete_task",
		{
			title: "Delete Task",
			description: `Delete a task from the user's workspace.

This is a destructive operation and cannot be undone.

Args:
  - taskId (string): The task ID to delete (required)

Returns:
  Confirmation of deletion.

Requires scope: mimrai:tasks:write`,
			inputSchema: DeleteTaskInputSchema,
			annotations: {
				readOnlyHint: false,
				destructiveHint: true,
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
				const task = await deleteTask({
					id: params.taskId,
					teamId: ctx.teamId,
				});

				return {
					content: [
						{
							type: "text",
							text: `Task '${task.title}' (${task.id}) deleted successfully.`,
						},
					],
					structuredContent: { deleted: true, taskId: task.id },
				};
			} catch (error) {
				return {
					content: [
						{
							type: "text",
							text: `Error deleting task: ${error instanceof Error ? error.message : "Unknown error"}`,
						},
					],
					isError: true,
				};
			}
		},
	);
}
