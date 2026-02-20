import { getAllToolsForUser } from "@api/ai/tools/tool-registry";
import {
	addDocumentToAgentSchema,
	createAgentSchema,
	deleteAgentMemorySchema,
	deleteAgentSchema,
	getAgentByIdSchema,
	getAgentMemoriesSchema,
	getAgentsSchema,
	getDocumentsForAgentSchema,
	removeDocumentFromAgentSchema,
	updateAgentSchema,
} from "@api/schemas/agents";
import { protectedProcedure, router } from "@api/trpc/init";
import {
	deleteAgentMemory,
	getAgentMemories,
} from "@mimir/db/queries/agent-memories";
import {
	addDocumentToAgent,
	createAgent,
	deleteAgent,
	getAgentById,
	getAgents,
	getDocumentsForAgent,
	removeDocumentFromAgent,
	updateAgent,
} from "@mimir/db/queries/agents";
import { getMimirUser } from "@mimir/db/queries/users";
import {
	formatToolName,
	getModels,
	HIDDEN_AGENT_INTEGRATIONS,
} from "@mimir/utils/agents";
import type { Tool } from "ai";

export const agentsRouter = router({
	get: protectedProcedure
		.input(getAgentsSchema)
		.query(async ({ ctx, input }) => {
			await getMimirUser({ teamId: ctx.team.id });
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

	getToolsForAgent: protectedProcedure
		.input(getAgentByIdSchema)
		.query(async ({ ctx, input }) => {
			const { toolboxes, errors } = await getAllToolsForUser({
				userId: ctx.user.id,
				teamId: ctx.user.teamId!,
			});

			const agent = await getAgentById({
				...input,
				teamId: ctx.user.teamId!,
			});

			const result: {
				name: string;
				description: string;
				status: "active" | "error";
			}[] = [];

			for (const toolboxKey of Object.keys(toolboxes)) {
				if (HIDDEN_AGENT_INTEGRATIONS.includes(toolboxKey)) {
					continue;
				}

				if (
					agent.activeToolboxes.length === 0 ||
					agent.activeToolboxes.includes(toolboxKey)
				) {
					result.push({
						name: formatToolName(toolboxKey),
						description: "",
						status: "active",
					});
				}
			}

			for (const errorKey of Object.keys(errors)) {
				if (HIDDEN_AGENT_INTEGRATIONS.includes(errorKey)) {
					continue;
				}
				if (
					agent.activeToolboxes.length === 0 ||
					agent.activeToolboxes.includes(errorKey)
				) {
					result.push({
						name: formatToolName(errorKey),
						description: `Failed to load tools from this source: ${errors[errorKey].message}`,
						status: "error",
					});
				}
			}

			return result;
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

	getDocumentsForAgent: protectedProcedure
		.input(getDocumentsForAgentSchema)
		.query(async ({ ctx, input }) => {
			return getDocumentsForAgent({
				...input,
				teamId: ctx.user.teamId!,
			});
		}),

	addDocumentToAgent: protectedProcedure
		.input(addDocumentToAgentSchema)
		.mutation(async ({ ctx, input }) => {
			return addDocumentToAgent({
				...input,
				teamId: ctx.user.teamId!,
			});
		}),

	removeDocumentFromAgent: protectedProcedure
		.input(removeDocumentFromAgentSchema)
		.mutation(async ({ ctx, input }) => {
			return removeDocumentFromAgent({
				...input,
				teamId: ctx.user.teamId!,
			});
		}),
});
