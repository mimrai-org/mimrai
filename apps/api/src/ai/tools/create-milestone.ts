import { createMilestone } from "@db/queries/milestones";
import { createProject, getProjects } from "@db/queries/projects";
import { getAppUrl } from "@mimir/utils/envs";
import { tool } from "ai";
import z from "zod";
import type { AppContext } from "../agents/config/shared";

export const createMilestoneToolSchema = z.object({
	name: z.string().min(1).describe("Name of the milestone"),
	description: z
		.string()
		.optional()
		.describe("Description of the milestone, HTML format supported"),
	color: z
		.string()
		.optional()
		.describe("Color of the milestone in HEX format without alpha"),
	dueDate: z
		.string()
		.optional()
		.describe("Due date of the milestone in ISO 8601 format"),
	projectId: z.string().min(1).describe("ID of the project (uuid)"),
});

export const createMilestoneTool = tool({
	description: "Create a new milestone",
	inputSchema: createMilestoneToolSchema,
	execute: async function* ({ ...input }, executionOptions) {
		try {
			const { userId, teamId } =
				executionOptions.experimental_context as AppContext;

			const result = await createMilestone({
				...input,

				teamId: teamId,
			});

			yield {
				type: "text",
				text: `Milestone "${input.name}" created successfully. You can view it here: ${getAppUrl()}/dashboard/projects/${input.projectId}/tasks?mId=${result.id}`,
			};
		} catch (error) {
			console.error("Error in createMilestoneTool:", error);
			throw error;
		}
	},
});
