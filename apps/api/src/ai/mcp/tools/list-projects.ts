import { getProjects } from "@mimir/db/queries/projects";
import { z } from "zod";
import type { MimraiMcpServer } from "../server";
import type { McpContext } from "./build-mcp";
import { hasScope, ListProjectsInputSchema } from "./schemas";

export function registerListProjectsTool(
	server: MimraiMcpServer,
	getContext: () => McpContext,
) {
	server.registerTool(
		"mimrai_list_projects",
		{
			title: "List Projects",
			description: `List projects in the user's workspace.

Use this to get valid project IDs when creating or updating tasks.

Returns:
  List of projects with their IDs, names, and details.

Requires scope: mimrai:tasks:read`,
			inputSchema: ListProjectsInputSchema,
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
				const projects = await getProjects({
					teamId: ctx.teamId,
					userId: ctx.userId,
				});

				const output = {
					projects: projects.data.map((p) => ({
						id: p.id,
						name: p.name,
						color: p.color,
						visibility: p.visibility,
						status: p.status,
					})),
				};

				let text: string;
				if (params.responseFormat === "markdown") {
					text = `## Available Projects\n\n${output.projects.map((p) => `- **${p.name}** (${p.id}) - ${p.visibility}, ${p.status}`).join("\n")}`;
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
							text: `Error listing projects: ${error instanceof Error ? error.message : "Unknown error"}`,
						},
					],
					isError: true,
				};
			}
		},
	);
}
