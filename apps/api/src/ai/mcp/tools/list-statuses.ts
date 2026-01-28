import { getStatuses } from "@mimir/db/queries/statuses";
import { z } from "zod";
import type { MimraiMcpServer } from "../server";
import type { McpContext } from "./build-mcp";
import { hasScope, ListStatusesInputSchema } from "./schemas";

export function registerListStatusesTool(
	server: MimraiMcpServer,
	getContext: () => McpContext,
) {
	server.registerTool(
		"mimrai_list_statuses",
		{
			title: "List Statuses",
			description: `List available task statuses in the user's workspace.

Use this to get valid status IDs when creating or updating tasks.

Returns:
  List of statuses with their IDs, names, and types.

Requires scope: mimrai:tasks:read`,
			inputSchema: ListStatusesInputSchema,
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
				const statuses = await getStatuses({
					teamId: ctx.teamId,
					pageSize: 20,
				});

				const output = {
					statuses: statuses.data.map((s) => ({
						id: s.id,
						name: s.name,
						type: s.type,
						order: s.order,
					})),
				};

				let text: string;
				if (params.responseFormat === "markdown") {
					text = `## Available Task Statuses\n\n${output.statuses.map((s) => `- **${s.name}** (${s.id}) - ${s.type}`).join("\n")}`;
				} else {
					text = JSON.stringify(output, null, 2);
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
							text: `Error listing statuses: ${error instanceof Error ? error.message : "Unknown error"}`,
						},
					],
					isError: true,
				};
			}
		},
	);
}
