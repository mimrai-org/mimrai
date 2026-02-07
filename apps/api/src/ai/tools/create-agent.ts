import { createAgent } from "@mimir/db/queries/agents";
import { AGENT_DEFAULT_MODEL } from "@mimir/utils/agents";
import { tool } from "ai";
import z from "zod";
import { getToolContext } from "../agents/config/shared";

export const createAgentToolSchema = z.object({
	name: z.string().min(1).describe("Name of the agent"),
	description: z.string().optional().describe("Description of the agent"),
	avatar: z.url().optional().describe("Avatar URL for the agent"),
	isActive: z.boolean().optional().describe("Whether the agent is active"),
	soul: z
		.string()
		.optional()
		.describe("Personality/soul configuration for the agent"),
});

export const createAgentTool = tool({
	description: "Create a new AI agent",
	inputSchema: createAgentToolSchema,
	execute: async function* (input, executionOptions) {
		try {
			const { teamId, behalfUserId } = getToolContext(executionOptions);

			const newAgent = await createAgent({
				teamId,
				name: input.name,
				description: input.description,
				avatar: input.avatar,
				behalfUserId,
				isActive: input.isActive ?? true,
				model: AGENT_DEFAULT_MODEL,
				soul: input.soul,
			});

			yield {
				type: "text",
				text: `Agent created successfully: ${newAgent.name}`,
				agentId: newAgent.id,
			};
		} catch (error) {
			console.error("Error creating agent:", error);
			yield { type: "text", text: "Error creating agent" };
		}
	},
});
