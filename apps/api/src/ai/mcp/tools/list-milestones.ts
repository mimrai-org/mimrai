import { getMilestones } from "@mimir/db/queries/milestones";
import { z } from "zod";
import type { MimraiMcpServer } from "../server";
import type { McpContext } from "./build-mcp";
import { hasScope, ListMilestonesInputSchema } from "./schemas";

export function registerListMilestonesTool(
	server: MimraiMcpServer,
	getContext: () => McpContext,
) {
	server.registerTool(
		"mimrai_list_milestones",
		{
			title: "List Milestones",
			description: `List milestones in the user's workspace.

Use this to get valid milestone IDs when creating or updating tasks.

Returns:
  List of milestones with their IDs, names, and details.

Requires scope: mimrai:tasks:read`,
			inputSchema: ListMilestonesInputSchema,
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
				const milestones = await getMilestones({
					teamId: ctx.teamId,
					projectId: params.projectId,
				});

				const output = {
					milestones: milestones.data.map((m) => ({
						id: m.id,
						name: m.name,
						color: m.color,
						projectId: m.projectId,
						dueDate: m.dueDate,
					})),
				};

				let text: string;
				if (params.responseFormat === "markdown") {
					text = `## Available Milestones\n\n${output.milestones.map((m) => `- **${m.name}** (${m.id}) - Due: ${m.dueDate || "No due date"}`).join("\n")}`;
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
							text: `Error listing milestones: ${error instanceof Error ? error.message : "Unknown error"}`,
						},
					],
					isError: true,
				};
			}
		},
	);
}
