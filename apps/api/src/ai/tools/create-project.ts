import { createProject, getProjects } from "@db/queries/projects";
import { getAppUrl } from "@mimir/utils/envs";
import { tool } from "ai";
import z from "zod";
import type { AppContext } from "../agents/config/shared";

export const createProjectToolSchema = z.object({
	name: z.string().min(1).describe("Name of the project"),
	description: z
		.string()
		.max(2000)
		.optional()
		.describe("Description of the project, HTML format supported"),
	color: z
		.string()
		.optional()
		.describe("Color of the project in HEX format without alpha"),
});

export const createProjectTool = tool({
	description: "Create a new project",
	inputSchema: createProjectToolSchema,
	execute: async function* ({ ...input }, executionOptions) {
		try {
			const { userId, teamId } =
				executionOptions.experimental_context as AppContext;

			const result = await createProject({
				...input,
				userId: userId,
				teamId: teamId,
			});

			yield {
				type: "text",
				text: `Project "${input.name}" created successfully. You can view it here: ${getAppUrl()}/dashboard/projects/${result.id}`,
			};
		} catch (error) {
			console.error("Error in createProjectTool:", error);
			throw error;
		}
	},
});
