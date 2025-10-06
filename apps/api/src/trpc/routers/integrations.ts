import {
	getIntegrationByIdSchema,
	getIntegrationByTypeSchema,
	getIntegrationLogsSchema,
	getLinkedUsersSchema,
	installIntegrationSchema,
	updateIntegrationSchema,
	validateIntegrationSchema,
} from "@api/schemas/integrations";
import { protectedProcedure, router } from "@api/trpc/init";
import {
	getIntegrationById,
	getIntegrationByType,
	getIntegrationLogs,
	getIntegrations,
	getLinkedUsers,
	installIntegration,
	updateIntegration,
} from "@mimir/db/queries/integrations";
import {
	type IntegrationName,
	integrationsRegistry,
} from "@mimir/integration/registry";
import { validateIntegration } from "@mimir/integration/validate";

export const integrationsRouter = router({
	get: protectedProcedure.query(async ({ ctx }) => {
		const installedIntegrations = await getIntegrations({
			teamId: ctx.user.teamId!,
		});

		return Object.values(integrationsRegistry).map((integration) => {
			const installed = installedIntegrations.find(
				(inst) => inst.type === integration.type,
			);
			return {
				...integration,
				configSchema: integration.configSchema._def,
				id: installed?.id,
				isInstalled: Boolean(installed),
			};
		});
	}),

	getByType: protectedProcedure
		.input(getIntegrationByTypeSchema)
		.query(async ({ ctx, input }) => {
			const integration = integrationsRegistry[input.type as IntegrationName];
			const installedIntegration = await getIntegrationByType({
				type: input.type,
				teamId: ctx.user.teamId!,
			});

			return {
				...integration,
				configSchema: integration.configSchema._def,
				isInstalled: !!installedIntegration,
				installedIntegration,
			};
		}),

	install: protectedProcedure
		.meta({ scopes: ["team:write"] })
		.input(installIntegrationSchema)
		.mutation(async ({ ctx, input }) => {
			return await installIntegration({
				type: input.type,
				config: input.config,
				teamId: ctx.user.teamId!,
			});
		}),

	update: protectedProcedure
		.meta({ scopes: ["team:write"] })
		.input(updateIntegrationSchema)
		.mutation(async ({ ctx, input }) => {
			return await updateIntegration({
				id: input.id,
				config: input.config,
				teamId: ctx.user.teamId!,
			});
		}),

	validate: protectedProcedure
		.meta({ scopes: ["team:write"] })
		.input(validateIntegrationSchema)
		.mutation(async ({ input }) => {
			return await validateIntegration(input.type, input.config);
		}),

	getLogs: protectedProcedure
		.input(getIntegrationLogsSchema)
		.query(async ({ ctx, input }) => {
			return getIntegrationLogs({
				...input,
				teamId: ctx.user.teamId!,
			});
		}),

	getById: protectedProcedure
		.input(getIntegrationByIdSchema)
		.query(async ({ ctx, input }) => {
			return getIntegrationById({
				...input,
				teamId: ctx.user.teamId!,
			});
		}),

	getLinkedUsers: protectedProcedure
		.input(getLinkedUsersSchema)
		.query(async ({ ctx, input }) => {
			return getLinkedUsers({
				...input,
				teamId: ctx.user.teamId!,
			});
		}),
});
