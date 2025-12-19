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
	getLinkedUserByUserId,
	getLinkedUsers,
	installIntegration,
	linkUserToIntegration,
} from "@mimir/db/queries/integrations";
import { Octokit } from "octokit";

export const githubRouter = router({
	install: protectedProcedure.mutation(async ({ ctx }) => {
		// Check if integration already exists
		let integration = await getIntegrationByType({
			type: "github",
			teamId: ctx.user.teamId!,
		});
		const linkedUsers = await getLinkedUsers({
			integrationType: "github",
			userId: ctx.user.id,
		});

		// Integration exists, check if the current user is linked
		if (integration) {
			const currentIntegrationLink = linkedUsers.data.find(
				(link) => link.teamId === integration.teamId,
			);

			if (currentIntegrationLink) {
				// User is already linked for this team, return existing integration
				return {
					integration: integration,
					redirect: false,
					message: "User already linked to existing integration",
				};
			}
		}

		// If user is already linked on another team, use that link to create the new link on this team
		if (linkedUsers.data.length > 0) {
			const existingLink = linkedUsers.data[0];

			// The integration not existing on this team, create a new one
			if (!integration) {
				integration = await installIntegration({
					type: "github",
					config: existingLink.integrationConfig,
					teamId: ctx.user.teamId!,
				});
			}

			await linkUserToIntegration({
				userId: ctx.user.id,
				integrationId: integration.id,
				integrationType: "github",
				externalUserId: existingLink.externalUserId,
				externalUserName: existingLink.externalUserName,
				accessToken: existingLink.accessToken,
				refreshToken: existingLink.refreshToken,
			});
			return {
				integration: integration,
				redirect: false,
				message: "User linked to existing integration",
			};
		}

		// Install the app for the team
		return {
			redirect: true,
			message: "Redirecting to GitHub App installation",
		};
	}),
	getRemoteRepositories: protectedProcedure
		.input(getRemoteRepositoriesSchema.optional())
		.query(async ({ ctx, input }) => {
			const link = await getLinkedUserByUserId({
				integrationType: "github",
				userId: ctx.user.id,
			});
			if (!link) {
				throw new Error("GitHub integration not found");
			}

			console.log(link);
			const token = link.accessToken;
			const octokit = new Octokit({ auth: token });
			const repos = await octokit.paginate(
				octokit.rest.repos.listForAuthenticatedUser,
			);

			return repos;
		}),

	getRemoteRepositoryBranches: protectedProcedure
		.input(getRemoteRepositoryBranchesSchema)
		.query(async ({ ctx, input }) => {
			const link = await getLinkedUserByUserId({
				integrationType: "github",
				userId: ctx.user.id,
			});
			if (!link) {
				throw new Error("GitHub integration not found");
			}
			const token = link.accessToken;
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

	getPendingPullRequest: protectedProcedure.query(async ({ ctx }) => {}),
});
