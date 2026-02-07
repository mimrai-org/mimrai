import { updateProject } from "@mimir/db/queries/projects";
import { getAppUrl } from "@mimir/utils/envs";
import { tool } from "ai";
import z from "zod";
import { getToolContext } from "../agents/config/shared";

export const updateProjectToolSchema = z.object({
	id: z.string().describe("ID of the project to update (uuid)"),
	name: z.string().min(1).optional().describe("Name of the project"),
	description: z
		.string()
		.optional()
		.describe("Description of the project, HTML format supported"),
	color: z
		.string()
		.optional()
		.describe("Color of the project in HEX format without alpha"),
});

export const updateProjectTool = tool({
	description: "Update an existing project",
	inputSchema: updateProjectToolSchema,
	execute: async function* ({ ...input }, executionOptions) {
		try {
			const { teamId } = getToolContext(executionOptions);

			const result = await updateProject({
				...input,
				teamId: teamId,
			});

			yield {
				type: "text",
				text: `Project "${input.name}" updated successfully. You can view it here: ${getAppUrl()}/dashboard/projects/${result.id}`,
			};
		} catch (error) {
			console.error("Error in updateProjectTool:", error);
			throw error;
		}
	},
});
