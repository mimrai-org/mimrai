import { getMilestones } from "@db/queries/milestones";
import { getAppUrl } from "@mimir/utils/envs";
import { tool } from "ai";
import z from "zod";
import type { AppContext } from "../agents/config/shared";

export const getMilestonesToolSchema = z.object({
	search: z.string().optional().describe("Search query"),
	cursor: z.string().optional().describe("Pagination cursor"),
	projectId: z
		.string()
		.optional()
		.describe("Filter milestones by project ID (uuid)"),
	pageSize: z.number().min(1).max(100).default(10).describe("Page size"),
});

export const getMilestonesTool = tool({
	description: "Retrieve a list of milestones",
	inputSchema: getMilestonesToolSchema,
	execute: async function* ({ search, ...input }, executionOptions) {
		try {
			const { userId, teamId } =
				executionOptions.experimental_context as AppContext;

			const result = await getMilestones({
				...input,
				teamId: teamId,
			});

			if (result.data.length === 0) {
				yield { type: "text", text: "No milestones found." };
				return;
			}

			const mappedData = result.data.map((milestone) => ({
				id: milestone.id,
				name: milestone.name,
				description: milestone.description,
				progress: milestone.progress,
				color: milestone.color,
				projectId: milestone.projectId,
				createdAt: milestone.createdAt,
				updatedAt: milestone.updatedAt,
				url: `${getAppUrl()}/dashboard/projects/${milestone.projectId}/tasks?mId=${milestone.id}`,
			}));

			yield {
				data: mappedData,
			};
		} catch (error) {
			console.error("Error in getProjectsTool:", error);
			throw error;
		}
	},
});
