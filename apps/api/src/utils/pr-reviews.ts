import { getLinkedUsers } from "@mimir/db/queries/integrations";
import type { syncPrReview } from "@mimir/db/queries/pr-reviews";
import type { PullRequest } from "@octokit/webhooks-types";

export const transformPr = async ({
	pr,
	teamId,
	repoId,
}: {
	pr: PullRequest;
	teamId: string;
	repoId: string;
}): Promise<Parameters<typeof syncPrReview>[0]> => {
	const linkedUsers = await getLinkedUsers({
		teamId: teamId,
		integrationType: "github",
	});

	const reviewers = pr.requested_reviewers
		.map((reviewer) => {
			if ("login" in reviewer === false) return null;

			return {
				name: reviewer.login,
				avatarUrl: reviewer.avatar_url,
				userId:
					linkedUsers.data.find(
						(link) => link.externalUserName === reviewer.login,
					)?.userId || null,
			};
		})
		.filter((r): r is NonNullable<typeof r> => r !== null);

	const assignees =
		pr.assignees
			?.map((assignee) => {
				if ("login" in assignee === false) return null;

				return {
					name: assignee.login,
					avatarUrl: assignee.avatar_url,
					userId:
						linkedUsers.data.find(
							(link) => link.externalUserName === assignee.login,
						)?.userId || null,
				};
			})
			.filter((a): a is NonNullable<typeof a> => a !== null) || [];

	return {
		body: pr.body ?? "",
		externalId: pr.id,
		prNumber: pr.number,
		prUrl: pr.html_url,
		repoId: pr.base.repo.id,
		connectedRepoId: repoId,
		title: pr.title,
		state: pr.state,
		draft: pr.draft,
		merged: pr.merged,
		reviewers,
		reviewersUserIds: reviewers
			.map((r) => r.userId)
			.filter((id): id is string => id !== null),
		assignees,
		assigneesUserIds: assignees
			.map((a) => a.userId)
			.filter((id): id is string => id !== null),
		teamId,
		createdAt: new Date(pr.created_at).toISOString(),
	};
};
