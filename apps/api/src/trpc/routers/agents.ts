import { getAllToolsForUser } from "@api/ai/tools/tool-registry";
import {
	createAgentSchema,
	deleteAgentSchema,
	getAgentByIdSchema,
	getAgentsSchema,
	updateAgentSchema,
} from "@api/schemas/agents";
import { protectedProcedure, router } from "@api/trpc/init";
import {
	createAgent,
	deleteAgent,
	getAgentById,
	getAgents,
	updateAgent,
} from "@mimir/db/queries/agents";
import { getModels } from "@mimir/utils/agents";

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
});
