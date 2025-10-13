import {
	getColumnsSchema,
	removeTaskFromPullRequestPlanSchema,
	updateConnectedRepositorySchema,
} from "@api/schemas/columns";
import {
	connectRepositorySchema,
	disconnectRepositorySchema,
	getRemoteRepositoriesSchema,
	getRemoteRepositoryBranchesSchema,
} from "@api/schemas/github";
import { protectedProcedure, router } from "@api/trpc/init";
import {
	connectRepository,
	disconnectRepository,
	getConnectedRepositories,
	getConnectedRepositoryByRepoId,
	removeTasksFromPullRequestPlan,
	updateConnectedRepository,
} from "@mimir/db/queries/github";
import {
	getIntegrationById,
	getIntegrationByType,
} from "@mimir/db/queries/integrations";
import { Octokit } from "octokit";

export const githubRouter = router({
	getRemoteRepositories: protectedProcedure
		.input(getRemoteRepositoriesSchema.optional())
		.query(async ({ ctx, input }) => {
			const integration = await getIntegrationByType({
				type: "github",
				teamId: ctx.user.teamId!,
			});
			if (!integration || integration.length === 0) {
				throw new Error("GitHub integration not found");
			}
			const token = integration[0].config.token;
			const octokit = new Octokit({ auth: token });
			const repos = await octokit.paginate(
				octokit.rest.repos.listForAuthenticatedUser,
			);

			return repos;
		}),

	getRemoteRepositoryBranches: protectedProcedure
		.input(getRemoteRepositoryBranchesSchema)
		.query(async ({ ctx, input }) => {
			const integration = await getIntegrationByType({
				type: "github",
				teamId: ctx.user.teamId!,
			});
			if (!integration || integration.length === 0) {
				throw new Error("GitHub integration not found");
			}
			const token = integration[0].config.token;
			const octokit = new Octokit({ auth: token });

			const connectedRepository = await getConnectedRepositoryByRepoId({
				teamId: ctx.user.teamId!,
				repositoryId: input.repositoryId,
			});

			if (!connectedRepository) {
				throw new Error("Repository not connected");
			}

			const owner = connectedRepository.repositoryName.split("/")[0];
			const repo = connectedRepository.repositoryName.split("/")[1];

			const branches = await octokit.paginate(octokit.rest.repos.listBranches, {
				owner,
				repo,
			});

			return branches;
		}),

	getConnectedRepositories: protectedProcedure
		.input(getColumnsSchema.optional())
		.query(({ ctx, input }) => {
			return getConnectedRepositories({
				teamId: ctx.user.teamId!,
			});
		}),

	connectRepository: protectedProcedure
		.input(connectRepositorySchema)
		.mutation(async ({ ctx, input }) => {
			const integration = await getIntegrationById({
				id: input.integrationId,
				teamId: ctx.user.teamId!,
			});

			if (!integration) {
				throw new Error("Integration not found");
			}

			return connectRepository({
				repositoryId: input.repositoryId,
				integrationId: input.integrationId,
				repositoryName: input.repositoryName,
				installationId: integration.config.installationId,
				teamId: ctx.user.teamId!,
			});
		}),

	disconnectRepository: protectedProcedure
		.input(disconnectRepositorySchema)
		.mutation(async ({ ctx, input }) => {
			return disconnectRepository({
				repositoryId: input.repositoryId,
				teamId: ctx.user.teamId!,
			});
		}),

	updateConnectedRepository: protectedProcedure
		.input(updateConnectedRepositorySchema)
		.mutation(async ({ ctx, input }) => {
			return updateConnectedRepository({
				...input,
				teamId: ctx.user.teamId!,
			});
		}),

	removeTrasksFromPullRequestPlan: protectedProcedure
		.input(removeTaskFromPullRequestPlanSchema)
		.mutation(async ({ ctx, input }) => {
			return removeTasksFromPullRequestPlan({
				...input,
				teamId: ctx.user.teamId!,
			});
		}),
});
