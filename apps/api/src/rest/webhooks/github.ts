import { OpenAPIHono } from "@hono/zod-openapi";
import {
	getConnectedRepositoryByInstallationId,
	getPullRequestPlanByHead,
	updatePullRequestPlanStatus,
} from "@mimir/db/queries/github";
import {
	getLinkedUserByUserId,
	installIntegration,
	linkUserToIntegration,
} from "@mimir/db/queries/integrations";
import { syncPrReview } from "@mimir/db/queries/pr-reviews";
import { updateTask } from "@mimir/db/queries/tasks";
import { getTeamById } from "@mimir/db/queries/teams";
import { log } from "@mimir/integration/logger";
import { getAppUrl } from "@mimir/utils/envs";
import type {
	PullRequest,
	PullRequestEvent,
	PushEvent,
	WebhookEventName,
} from "@octokit/webhooks-types";
import crypto from "crypto";
import type { MiddlewareHandler } from "hono";
import { Octokit } from "octokit";
import { protectedMiddleware } from "../middleware";
import type { Context } from "../types";

const app = new OpenAPIHono<Context>();

const validateGithubWebhook: MiddlewareHandler = async (c, next) => {
	const signature = c.req.header("X-Hub-Signature-256");
	const rawBody = await c.req.text();
	const secret = process.env.GITHUB_WEBHOOK_SECRET;

	if (!signature || !rawBody || !secret) {
		return c.json({ ok: false }, 400);
	}

	const hmac = crypto.createHmac("sha256", secret);
	hmac.update(rawBody);
	const generatedSignature = `sha256=${hmac.digest("hex")}`;

	if (
		crypto.timingSafeEqual(
			Buffer.from(signature),
			Buffer.from(generatedSignature),
		)
	) {
		await next();
	} else {
		return c.json({ ok: false }, 401);
	}
};

app.post(validateGithubWebhook, async (c) => {
	const event = c.req.header("X-GitHub-Event") as WebhookEventName;
	const body = await c.req.json();
	console.log(`Received GitHub webhook event: ${event}`);

	switch (event) {
		case "push": {
			const payload = body as PushEvent;
			const repositoryId = payload.repository.id;
			const installationId = payload.installation?.id;
			console.log("Received push event for repository:", repositoryId);

			if (!installationId) {
				console.log("No installation ID found in the payload");
				break;
			}

			const connectedRepository = await getConnectedRepositoryByInstallationId({
				installationId: installationId,
				repoId: repositoryId,
			});

			if (!connectedRepository) {
				console.log("Repository not connected");
				break;
			}
			const teamId = connectedRepository.teamId;

			const pushHead =
				payload.commits[payload.commits.length - 2]?.id || payload.after;

			const prPlans = await getPullRequestPlanByHead({
				repoId: repositoryId,
				headCommitSha: pushHead,
				teamId: teamId,
			});
			if (!prPlans) {
				console.log("No plan found for the push event");
				break;
			}

			// Execute the plan: move tasks to their new columns
			for (const plan of prPlans) {
				if (plan.status === "canceled") {
					console.log("Plan has been canceled, skipping execution");
					continue;
				}

				try {
					await updateTask({
						id: plan.taskId,
						teamId: teamId,
						statusId: plan.statusId,
					});
				} catch (error) {
					log(
						connectedRepository.integrationId,
						"error",
						`Error updating task ${plan.taskId} to status ${plan.statusId} for team ${teamId}`,
						{
							taskId: plan.taskId,
							statusId: plan.statusId,
						},
					);
					console.error("Error updating task:", error);
				}
				await updatePullRequestPlanStatus({
					id: plan.id,
					status: "completed",
				});
			}

			console.log(
				`Executed plan for push event on repository ${payload.repository.full_name}`,
			);

			break;
		}

		case "pull_request": {
			const payload = body as PullRequestEvent;
			const action = payload.action;
			const repositoryId = payload.repository.id;
			const installationId = payload.installation?.id;
			//       console.log("Received pull_request event:", action, repositoryId);

			if (!installationId) {
				console.log("No installation ID found in the payload");
				break;
			}

			const allowedActions: (typeof payload.action)[] = [
				"opened",
				"reopened",
				"synchronize",
				"edited",
				"closed",
				"assigned",
				"unassigned",
				"review_requested",
				"review_request_removed",
				"labeled",
				"unlabeled",
				"ready_for_review",
				"converted_to_draft",
			];
			if (!allowedActions.includes(action)) {
				console.log(`Ignoring pull_request action: ${action}`);
				break;
			}

			const pr = payload.pull_request as PullRequest;

			//       const title = pr.title;
			//       const prBody = pr.body || "";
			//       const targetBranchName = pr.base.ref.split("/").pop() || "";

			const connectedRepository = await getConnectedRepositoryByInstallationId({
				installationId: installationId,
				repoId: repositoryId,
			});

			if (!connectedRepository) {
				console.log("Repository not connected");
				break;
			}
			const teamId = connectedRepository.teamId;

			const link = await getLinkedUserByUserId({
				teamId,
				userId: connectedRepository.connectedByUserId,
			});

			if (!link) {
				console.log("No linked user found for the connected repository");
				break;
			}

			const octokit = new Octokit({
				auth: link.accessToken,
			});

			console.log("Processing pull request event for PR #", pr.number);

			const onlyUserAssignees = pr.assignees?.filter((a) => "login" in a) || [];
			const onlyUserReviewers =
				pr.requested_reviewers?.filter((r) => "login" in r) || [];

			const syncResult = await syncPrReview({
				...pr,
				teamId,
				externalId: pr.id,
				connectedRepoId: connectedRepository.id,
				merged: pr.merged,
				assignees: onlyUserAssignees,
				requested_reviewers: onlyUserReviewers,
			});

			if (syncResult?.magicActions.length > 0) {
				// Comment on the PR about the detected magic actions
				octokit.rest.issues.createComment({
					owner: payload.repository.owner.login,
					repo: payload.repository.name,
					issue_number: pr.number,
					body: `${syncResult.magicActions
						.map(
							(action) =>
								`- ${action.magicWord} [${action.prefix}-${action.sequence}](${action.taskUrl})`,
						)
						.join("\n")}
					`,
				});

				console.log(
					`Commented on PR #${pr.number} about detected magic task actions.`,
				);
			}

			//       const branches = connectedRepository.branches || [];
			//       if (!branches.includes(targetBranchName)) {
			//         console.log("Branch is not connected");
			//         break;
			//       }

			//       const integration = await getIntegrationById({
			//         id: connectedRepository.integrationId,
			//       });
			//       if (!integration) {
			//         console.log("Integration not found for the connected repository");
			//         break;
			//       }

			//       const octokit = new Octokit({
			//         auth: integration.config.token,
			//       });

			//       console.log(`Received pull_request event with action: ${action}`);
			//       if (
			//         action === "opened" ||
			//         action === "reopened" ||
			//         action === "synchronize"
			//       ) {

			//         const commitsResponse = await fetch(pr._links.commits.href, {
			//           headers: {
			//             Accept: "application/vnd.github.v3+json",
			//             Authorization: `Bearer ${integration.config.token}`,
			//           },
			//         });
			//         const commits = (await commitsResponse.json()) as Array<{
			//           commit: Commit;
			//         }>;

			//         const columns = (
			//           await getColumns({
			//             teamId,
			//             pageSize: 20,
			//           })
			//         ).data.map((column) => ({
			//           id: column.id,
			//           name: column.name,
			//           description: column.description,
			//           type: column.type,
			//         }));

			//         const taskTitles = (
			//           await getTasks({
			//             pageSize: 20,
			//             teamId,
			//             columnId: columns
			//               .filter((col) => !["backlog", "done"].includes(col.type))
			//               .map((col) => col.id),
			//           })
			//         ).data.map((task) => ({
			//           id: task.id,
			//           title: task.title,
			//           columnId: task.columnId,
			//         }));

			//         const messages = commits.map((commit) => commit.commit.message);

			//         const response = await generateObject({
			//           model: "openai/gpt-4o",
			//           schema: z.object({
			//             updates: z.array(
			//               z.object({
			//                 taskTitle: z.string().describe("Title of the task to move"),
			//                 taskId: z.string().describe("ID of the task to move"),
			//                 currentTaskColumnName: z
			//                   .string()
			//                   .describe("Current column name of the task"),
			//                 columnId: z
			//                   .string()
			//                   .describe("ID of the column to move the task to"),
			//                 columnName: z
			//                   .string()
			//                   .describe("Name of the column to move the task to"),
			//               })
			//             ),
			//           }),
			//           prompt: `You are an AI assistant that helps update tasks in a project management system based on commit messages from a git repository.

			// 				You have a list of tasks with their IDs, titles, and current column IDs:
			// 				${JSON.stringify(taskTitles, null, 2)}

			// 				You also have a list of columns with their IDs, names, and descriptions:
			// 				${JSON.stringify(columns, null, 2)}

			// 				Based on the following commit messages of a push from repository ${payload.repository.full_name}, determine which tasks need to be moved to which columns.
			// 				Commit Messages:
			// 				${JSON.stringify(messages, null, 2)}

			// 				Keep in mind that this is Pull Request to branch ${targetBranchName} with the following details:
			// 				Title: ${title}
			// 				Body: ${prBody}

			// 				HOW DETERMINE UPDATES:
			// 				- Analyze the commit messages to identify exact or close matches with task titles.
			//         - For each identified task, decide the most appropriate column to move it to based on the content of the commit messages.
			// 				- Almost always unless specified by the user, the task should be moved to a "done" column.
			// 				`,
			//         });

			//         console.log(`New PR opened on connected branch: ${targetBranchName}`);

			//         console.log("Task updates to perform:", response.object.updates);

			//         const existingPlans = await getPullRequestPlanByPrId({
			//           prNumber: pr.number,
			//           repoId: repositoryId,
			//           teamId,
			//         });

			//         for (const plan of existingPlans) {
			//           // delete existing comment
			//           await octokit.rest.issues.deleteComment({
			//             comment_id: plan.commentId!,
			//             owner: payload.repository.owner.login,
			//             repo: payload.repository.name,
			//           });
			//         }

			//         for (const update of response.object.updates) {
			//           const newPlan = await upsertPullRequestPlan({
			//             prNumber: pr.number,
			//             teamId,
			//             repoId: repositoryId,
			//             headCommitSha: pr.head.sha,
			//             prUrl: pr.html_url,
			//             prTitle: pr.title,
			//             status: "pending",
			//             taskId: update.taskId,
			//             columnId: update.columnId,
			//           });
			//           const comment = await octokit.rest.issues.createComment({
			//             issue_number: pr.number,
			//             body: `> Task [${update.taskTitle}](${getTaskUrl(update.taskId)}) will be moved to column **${update.columnName}**.

			// [❌ Cancel this plan](${getApiUrl()}/api/github/plans/${newPlan.id}/cancel?integrationId=${connectedRepository.integrationId})
			//             `,
			//             owner: payload.repository.owner.login,
			//             repo: payload.repository.name,
			//           });

			//           await updatePullRequestPlanCommentId({
			//             commentId: comment.data.id,
			//             id: newPlan.id,
			//           });
			//         }

			//         log(
			//           integration.id,
			//           "info",
			//           `Created/Updated plan for PR #${pr.number} in repository ${payload.repository.full_name}`,
			//           {
			//             prNumber: pr.number,
			//             repoId: repositoryId,
			//           },
			//           response.usage.inputTokens,
			//           response.usage.outputTokens
			//         );
			//       }
			break;
		}

		default: {
			console.log(`Unhandled event type: ${event}`);
			break;
		}
	}

	return c.json({ ok: true });
});

app.get("/setup", ...protectedMiddleware, async (c) => {
	const session = c.get("session");
	const teamId = c.get("teamId");
	const code = c.req.query("code");
	const installationId = c.req.query("installation_id");

	const team = await getTeamById(teamId!);
	if (!team) {
		return c.json({ error: "Team not found" }, 404);
	}

	// get github access token
	const response = await fetch("https://github.com/login/oauth/access_token", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
		},
		body: JSON.stringify({
			client_id: process.env.GITHUB_CLIENT_ID,
			client_secret: process.env.GITHUB_CLIENT_SECRET,
			code,
		}),
	});

	const data = (await response.json()) as { access_token: string };
	const accessToken = data.access_token;

	// Get user info
	const userResponse = await fetch("https://api.github.com/user", {
		headers: {
			Authorization: `Bearer ${accessToken}`,
			Accept: "application/vnd.github.v3+json",
		},
	});
	const userData: {
		name: string;
		login: string;
		id: number;
	} = await userResponse.json();

	// Create the integration with the access token
	const integration = await installIntegration({
		type: "github",
		teamId: teamId!,
		config: {
			token: data.access_token,
			installationId,
		},
	});

	await linkUserToIntegration({
		integrationId: integration.id,
		userId: session!.userId,
		externalUserId: userData.id.toString(),
		externalUserName: userData.login,
		accessToken: data.access_token,
		refreshToken: "",
		integrationType: "github",
	});

	return c.redirect(
		`${getAppUrl()}/team/${team.slug}/settings/integrations/${integration.type}`,
	);
});

export { app as githubWebhook };
