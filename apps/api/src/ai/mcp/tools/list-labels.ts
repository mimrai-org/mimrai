import { getLabels } from "@mimir/db/queries/labels";
import { z } from "zod";
import type { MimraiMcpServer } from "../server";
import type { McpContext } from "./build-mcp";
import { hasScope, ListLabelsInputSchema } from "./schemas";

export function registerListLabelsTool(
	server: MimraiMcpServer,
	getContext: () => McpContext,
) {
	server.registerTool(
		"mimrai_list_labels",
		{
			title: "List Labels",
			description: `List available task labels in the user's workspace.

Use this to get valid label IDs when creating or updating tasks.

Returns:
  List of labels with their IDs, names, and colors.

Requires scope: mimrai:tasks:read`,
			inputSchema: ListLabelsInputSchema,
			annotations: {
				readOnlyHint: true,
				destructiveHint: false,
				idempotentHint: true,
				openWorldHint: false,
			},
		},
		async () => {
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
				const labels = await getLabels({
					teamId: ctx.teamId,
					pageSize: 50,
				});

				const output = {
					labels: labels.map((l) => ({
						id: l.id,
						name: l.name,
						color: l.color,
					})),
				};

				let text: string;
				if (params.responseFormat === "markdown") {
					text = `## Available Task Labels\n\n${output.labels.map((l) => `- **${l.name}** (${l.id}) - Color: ${l.color}`).join("\n")}`;
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
							text: `Error listing labels: ${error instanceof Error ? error.message : "Unknown error"}`,
						},
					],
					isError: true,
				};
			}
		},
	);
}
