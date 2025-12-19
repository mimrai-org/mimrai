import { getConnectedRepositories } from "@mimir/db/queries/github";
import {
	getIntegrationByType,
	getLinkedUsers,
} from "@mimir/db/queries/integrations";
import { syncPrReview } from "@mimir/db/queries/pr-reviews";
import { logger, schemaTask } from "@trigger.dev/sdk";
import { Octokit } from "octokit";
import z from "zod";

export const syncTeamPrReviewsJob = schemaTask({
	id: "sync-team-pr-reviews",
	schema: z.object({
		teamId: z.string(),
		repoId: z.string().optional(),
	}),
	run: async ({ teamId, repoId }, ctx) => {
		const integration = await getIntegrationByType({
			type: "github",
			teamId: teamId,
		});

		if (!integration) {
			throw new Error("GitHub integration not found for team");
		}

		logger.log(
			`Found GitHub integration for team ${teamId}: ${integration.id}`,
		);

		const linkedUsers = await getLinkedUsers({
			teamId: teamId,
			integrationType: "github",
		});

		logger.log(
			`Found ${linkedUsers.data.length} linked users for team ${teamId}`,
		);

		const connectedRepositories = await getConnectedRepositories({
			teamId: teamId,
		});

		logger.log(
			`Found ${connectedRepositories.length} connected repositories for team ${teamId}`,
		);

		for (const repo of connectedRepositories) {
			if (repoId && repo.id !== repoId) {
				continue;
			}

			const owner = repo.repositoryName.split("/")[0];
			const repository = repo.repositoryName.split("/")[1];

			const link = linkedUsers.data.find(
				(link) => link.userId === repo.connectedByUserId,
			);

			if (!link) {
				logger.error(`No linked user found for owner: ${owner}`);
				continue;
			}

			const token = link.accessToken;
			const octokit = new Octokit({ auth: token });

			const { data: pullRequests } = await octokit.rest.pulls.list({
				owner,
				repo: repository,
				per_page: 100,
				sort: "updated",
				direction: "desc",
			});

			logger.log(
				`Found ${pullRequests.length} pull requests for repository ${repo.repositoryName}`,
			);

			const syncPromises = pullRequests.map(async (pr) => {
				const reviewers = pr.requested_reviewers.map((reviewer) => ({
					name: reviewer.login,
					avatarUrl: reviewer.avatar_url,
					userId:
						linkedUsers.data.find(
							(link) => link.externalUserName === reviewer.login,
						)?.userId || null,
				}));

				const assignees =
					pr.assignees?.map((assignee) => ({
						name: assignee.login,
						avatarUrl: assignee.avatar_url,
						userId:
							linkedUsers.data.find(
								(link) => link.externalUserName === assignee.login,
							)?.userId || null,
					})) || [];

				return syncPrReview({
					body: pr.body ?? "",
					externalId: pr.id,
					prNumber: pr.number,
					prUrl: pr.html_url,
					repoId: pr.base.repo.id,
					connectedRepoId: repo.id,
					title: pr.title,
					state: pr.state,
					draft: pr.draft,
					merged: pr.merged_at !== null,
					reviewers,
					assignees,
					assigneesUserIds: assignees
						.map((a) => a.userId)
						.filter((id): id is string => id !== null),
					reviewersUserIds: reviewers
						.map((r) => r.userId)
						.filter((id): id is string => id !== null),
					teamId,
					createdAt: new Date(pr.created_at).toISOString(),
				});
			});

			await Promise.all(syncPromises);
		}
	},
});
