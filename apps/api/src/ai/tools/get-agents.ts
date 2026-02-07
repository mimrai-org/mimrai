import { getAgents } from "@mimir/db/queries/agents";
import { tool } from "ai";
import z from "zod";
import { getToolContext } from "../agents/config/shared";

export const getAgentsToolSchema = z.object({
	isActive: z.boolean().optional().describe("Filter by active status"),
	cursor: z.string().optional().describe("Pagination cursor"),
	pageSize: z.number().min(1).max(100).default(20).describe("Page size"),
});

export const getAgentsTool = tool({
	description: "Retrieve a list of AI agents",
	inputSchema: getAgentsToolSchema,
	execute: async function* ({ isActive, cursor, pageSize }, executionOptions) {
		try {
			const { teamId } = getToolContext(executionOptions);

			const result = await getAgents({
				teamId,
				isActive,
				cursor,
				pageSize,
			});

			if (result.data.length === 0) {
				yield { type: "text", text: "No agents found." };
				return;
			}

			const mappedData = result.data.map((agent) => ({
				id: agent.id,
				name: agent.name,
				description: agent.description,
				avatar: agent.avatar,
				behalfUserId: agent.behalfUserId,
				activeToolboxes: agent.activeToolboxes,
				isActive: agent.isActive,
				model: agent.model,
				soul: agent.soul,
				createdAt: agent.createdAt,
				updatedAt: agent.updatedAt,
			}));

			yield {
				data: mappedData,
				meta: result.meta,
			};
		} catch (error) {
			console.error("Error in getAgentsTool:", error);
			throw error;
		}
	},
});
