import { getAllToolsForUser } from "@api/ai/tools/tool-registry";
import {
	createAgentSchema,
	deleteAgentMemorySchema,
	deleteAgentSchema,
	getAgentByIdSchema,
	getAgentMemoriesSchema,
	getAgentsSchema,
	updateAgentSchema,
} from "@api/schemas/agents";
import { protectedProcedure, router } from "@api/trpc/init";
import {
	deleteAgentMemory,
	getAgentMemories,
} from "@mimir/db/queries/agent-memories";
import {
	createAgent,
	deleteAgent,
	getAgentById,
	getAgents,
	updateAgent,
} from "@mimir/db/queries/agents";
import { getModels } from "@mimir/utils/agents";
import type { Tool } from "ai";

export const agentsRouter = router({
	get: protectedProcedure
		.input(getAgentsSchema)
		.query(async ({ ctx, input }) => {
			return getAgents({
				...input,
				teamId: ctx.user.teamId!,
			});
		}),

	getById: protectedProcedure
		.input(getAgentByIdSchema)
		.query(async ({ ctx, input }) => {
			return getAgentById({
				...input,
				teamId: ctx.user.teamId!,
			});
		}),

	create: protectedProcedure
		.input(createAgentSchema)
		.mutation(async ({ ctx, input }) => {
			return await createAgent({
				...input,
				behalfUserId: input.authorizeIntegrations ? ctx.user.id : undefined,
				teamId: ctx.user.teamId!,
			});
		}),

	update: protectedProcedure
		.input(updateAgentSchema)
		.mutation(async ({ ctx, input }) => {
			return updateAgent({
				...input,
				behalfUserId: input.authorizeIntegrations ? ctx.user.id : undefined,
				teamId: ctx.user.teamId!,
			});
		}),

	delete: protectedProcedure
		.input(deleteAgentSchema)
		.mutation(async ({ ctx, input }) => {
			return deleteAgent({
				...input,
				teamId: ctx.user.teamId!,
			});
		}),

	getModels: protectedProcedure.query(async () => {
		return getModels();
	}),

	getToolboxes: protectedProcedure.query(async ({ ctx }) => {
		const { toolboxes } = await getAllToolsForUser({
			userId: ctx.user.id,
			teamId: ctx.user.teamId!,
		});

		return Object.keys(toolboxes);
	}),

	getTools: protectedProcedure.query(async ({ ctx }) => {
		const { toolboxes } = await getAllToolsForUser({
			userId: ctx.user.id,
			teamId: ctx.user.teamId!,
		});

		const result: { name: string; description: string }[] = [];
		for (const toolboxKey of Object.keys(toolboxes)) {
			const toolbox = toolboxes[toolboxKey as keyof typeof toolboxes];
			result.push({
				name: toolboxKey,
				description: "",
			});

			for (const toolKey of Object.keys(toolbox)) {
				const tool = toolbox[toolKey as keyof typeof toolbox] as Tool;
				result.push({
					name: `${toolboxKey}:${toolKey}`,
					description: tool.description,
				});
			}
		}

		console.log("Fetched tools for user:", ctx.user.id, result);

		return result;
	}),

	getMemories: protectedProcedure
		.input(getAgentMemoriesSchema)
		.query(async ({ ctx, input }) => {
			return getAgentMemories({
				agentId: input.agentId,
				teamId: ctx.user.teamId!,
				category: input.category,
				limit: input.limit,
			});
		}),

	deleteMemory: protectedProcedure
		.input(deleteAgentMemorySchema)
		.mutation(async ({ input }) => {
			return deleteAgentMemory(input.id);
		}),
});
