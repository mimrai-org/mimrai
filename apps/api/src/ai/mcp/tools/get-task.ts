import { getTasks } from "@mimir/db/queries/tasks";
import type { MimraiMcpServer } from "../server";
import type { McpContext } from "./build-mcp";
import { GetTaskInputSchema, hasScope, truncateText } from "./schemas";

export function registerGetTaskTool(
	server: MimraiMcpServer,
	getContext: () => McpContext,
) {
	server.registerTool(
		"mimrai_get_task",
		{
			title: "Get Task",
			description: `Get detailed information about a specific task.

Args:
  - taskId (string): The task ID or permalink ID to retrieve

Returns:
  Complete task details including description, checklist, comments, and activity.

Requires scope: mimrai:tasks:read`,
			inputSchema: GetTaskInputSchema,
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
				// Try to find task by ID or permalink
				const result = await getTasks({
					teamId: ctx.teamId,
					userId: ctx.userId,
					search: params.taskId,
					pageSize: 1,
				});

				if (!result.data || result.data.length === 0) {
					return {
						content: [
							{
								type: "text",
								text: `Error: Task not found with ID '${params.taskId}'`,
							},
						],
						isError: true,
					};
				}

				const task = result.data[0];
				const output = {
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
					checklist: task.checklistSummary,
					attachments: task.attachments,
					repositoryName: task.repositoryName,
					branchName: task.branchName,
					recurring: task.recurring,
					createdAt: task.createdAt,
					updatedAt: task.updatedAt,
					completedAt: task.completedAt,
				};

				let text: string;
				if (params.responseFormat === "markdown") {
					text = `## Task: ${output.title}\n\n**ID:** ${output.id}\n**Status:** ${output.status?.name || "Unknown"}\n**Assignee:** ${output.assignee?.name || "Unassigned"}\n**Priority:** ${output.priority || "None"}\n**Due Date:** ${output.dueDate || "None"}\n\n${output.description ? `**Description:**\n${output.description}\n\n` : ""}${output.labels?.length ? `**Labels:** ${output.labels.map((l) => l.name).join(", ")}\n\n` : ""}**Created:** ${output.createdAt}\n**Updated:** ${output.updatedAt}`;
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
							text: `Error getting task: ${error instanceof Error ? error.message : "Unknown error"}`,
						},
					],
					isError: true,
				};
			}
		},
	);
}
