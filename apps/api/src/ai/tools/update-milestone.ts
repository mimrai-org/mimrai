import { updateMilestone } from "@mimir/db/queries/milestones";
import { getAppUrl } from "@mimir/utils/envs";
import { tool } from "ai";
import z from "zod";
import { getToolContext } from "../agents/config/shared";

export const updateMilestoneToolSchema = z.object({
	id: z.string().min(1).describe("ID of the milestone (uuid)"),
	name: z.string().min(1).optional().describe("Name of the milestone"),
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
});

export const updateMilestoneTool = tool({
	description: "Update an existing milestone",
	inputSchema: updateMilestoneToolSchema,
	execute: async function* ({ ...input }, executionOptions) {
		try {
			const { userId, teamId } = getToolContext(executionOptions);

			const result = await updateMilestone({
				...input,
				teamId: teamId,
			});

			yield {
				type: "text",
				text: `Milestone "${input.name}" updated successfully. You can view it here: ${getAppUrl()}/dashboard/projects/${result.projectId}/tasks?mId=${result.id}`,
			};
		} catch (error) {
			console.error("Error in updateMilestoneTool:", error);
			throw error;
		}
	},
});
