import { getColumns } from "@db/queries/columns";
import {
  getConnectedRepositoryByInstallationId,
  getPullRequestPlanByHead,
  getPullRequestPlanByPrId,
  updatePullRequestPlanCommentId,
  updatePullRequestPlanStatus,
  upsertPullRequestPlan,
} from "@db/queries/github";
import {
  getIntegrationById,
  installIntegration,
} from "@db/queries/integrations";
import { getTasks, updateTask } from "@db/queries/tasks";
import { OpenAPIHono } from "@hono/zod-openapi";
import { log } from "@mimir/integration/logger";
import { getApiUrl, getAppUrl } from "@mimir/utils/envs";
import type {
  Commit,
  PullRequest,
  PullRequestEvent,
  PushEvent,
  WebhookEventName,
} from "@octokit/webhooks-types";
import { generateObject } from "ai";
import crypto from "crypto";
import type { MiddlewareHandler } from "hono";
import { Octokit } from "octokit";
import z from "zod";
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
      Buffer.from(generatedSignature)
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

      const prPlan = await getPullRequestPlanByHead({
        repoId: repositoryId,
        headCommitSha: pushHead,
        teamId: teamId,
      });
      if (!prPlan) {
        console.log("No plan found for the push event");
        break;
      }

      if (prPlan.status === "canceled") {
        console.log("Plan has been canceled, skipping execution");
        break;
      }

      // Execute the plan: move tasks to their new columns
      for (const item of prPlan.plan) {
        try {
          await updateTask({
            id: item.taskId,
            teamId: teamId,
            columnId: item.columnId,
          });
        } catch (error) {
          log(
            connectedRepository.integrationId,
            "error",
            `Error updating task ${item.taskId} to column ${item.columnId} for team ${teamId}`,
            {
              taskId: item.taskId,
              columnId: item.columnId,
            }
          );
          console.error("Error updating task:", error);
        }
      }

      await updatePullRequestPlanStatus({
        id: prPlan.id,
        status: "completed",
      });

      console.log(
        `Executed plan for push event on repository ${payload.repository.full_name}`
      );

      break;
    }

    case "pull_request": {
      const payload = body as PullRequestEvent;
      const action = payload.action;
      const repositoryId = payload.repository.id;
      const installationId = payload.installation?.id;
      console.log("Received pull_request event:", action, repositoryId);

      const allowedActions: (typeof payload.action)[] = [
        "opened",
        "reopened",
        "synchronize",
      ];
      if (!allowedActions.includes(action)) {
        console.log(`Ignoring pull_request action: ${action}`);
        break;
      }

      const pr = payload.pull_request as PullRequest;

      const title = pr.title;
      const prBody = pr.body || "";
      const targetBranchName = pr.base.ref.split("/").pop() || "";

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

      const branches = connectedRepository.branches || [];
      if (!branches.includes(targetBranchName)) {
        console.log("Branch is not connected");
        break;
      }

      const integration = await getIntegrationById({
        id: connectedRepository.integrationId,
      });
      if (!integration) {
        console.log("Integration not found for the connected repository");
        break;
      }

      const octokit = new Octokit({
        auth: integration.config.token,
      });

      console.log(`Received pull_request event with action: ${action}`);
      if (
        action === "opened" ||
        action === "reopened" ||
        action === "synchronize"
      ) {
        const commitsResponse = await fetch(pr._links.commits.href, {
          headers: {
            Accept: "application/vnd.github.v3+json",
            Authorization: `Bearer ${integration.config.token}`,
          },
        });
        const commits = (await commitsResponse.json()) as Array<{
          commit: Commit;
        }>;

        const columns = (
          await getColumns({
            teamId,
            pageSize: 20,
          })
        ).data.map((column) => ({
          id: column.id,
          name: column.name,
          description: column.description,
          type: column.type,
        }));

        const taskTitles = (
          await getTasks({
            pageSize: 20,
            teamId,
            columnId: columns
              .filter((col) => !["backlog", "done"].includes(col.type))
              .map((col) => col.id),
          })
        ).data.map((task) => ({
          id: task.id,
          title: task.title,
          columnId: task.columnId,
        }));

        const messages = commits.map((commit) => commit.commit.message);

        const response = await generateObject({
          model: "openai/gpt-4o",
          schema: z.object({
            message: z.string().describe("Summary of the plan of action"),
            updates: z.array(
              z.object({
                taskTitle: z.string().describe("Title of the task to move"),
                taskId: z.string().describe("ID of the task to move"),
                currentTaskColumnName: z
                  .string()
                  .describe("Current column name of the task"),
                columnId: z
                  .string()
                  .describe("ID of the column to move the task to"),
                columnName: z
                  .string()
                  .describe("Name of the column to move the task to"),
                reason: z
                  .string()
                  .describe(
                    "Brief reason explaining why the task is being moved"
                  ),
              })
            ),
          }),
          prompt: `You are an AI assistant that helps update tasks in a project management system based on commit messages from a git repository.
				
				You have a list of tasks with their IDs, titles, and current column IDs:
				${JSON.stringify(taskTitles, null, 2)}

				You also have a list of columns with their IDs, names, and descriptions:
				${JSON.stringify(columns, null, 2)}

				Based on the following commit messages of a push from repository ${payload.repository.full_name}, determine which tasks need to be moved to which columns.
				Commit Messages:
				${JSON.stringify(messages, null, 2)}

				Keep in mind that this is Pull Request to branch ${targetBranchName} with the following details:
				Title: ${title}
				Body: ${prBody}

				HOW DETERMINE UPDATES:
				- If a commit message references a task title (exact or partial match), that task should be considered for an update.
				- If the PR title or body references a task title (exact or partial match), that task should be considered for an update.
				- Use the entire context of the commit messages, PR title, and PR body to determine the most appropriate column for each task.
        - If a commit message, PR title, or PR body suggests a specific column for a task, that column should be considered for the update.
				- If the context suggests that the task is completed, move it to the "done" column.
				
				EXAMPLE OF MATCHING REFERENCE:
				- Commit message: "fix: login issue" could match a task titled "The users cannot login".
				- PR title: "feature: improve user profiles" could match a task titled "Improve user profiles by adding more fields".
				- PR body: "This PR fixes the issue with the dashboard subscriptions" could match a task titled "Cannot see subscriptions in dashboard".
				`,
        });

        console.log(`New PR opened on connected branch: ${targetBranchName}`);

        console.log("Task updates to perform:", response.object.updates);

        const existingPlan = await getPullRequestPlanByPrId({
          prNumber: pr.number,
          repoId: repositoryId,
          teamId,
        });

        if (existingPlan) {
          // delete existing comment
          await octokit.rest.issues.deleteComment({
            comment_id: existingPlan.commentId!,
            owner: payload.repository.owner.login,
            repo: payload.repository.name,
          });
        }

        const newPlan = await upsertPullRequestPlan({
          prNumber: pr.number,
          teamId,
          repoId: repositoryId,
          headCommitSha: pr.head.sha,
          prUrl: pr.html_url,
          prTitle: pr.title,
          status: "pending",
          plan: response.object.updates.map((update) => ({
            taskId: update.taskId,
            columnId: update.columnId,
          })),
        });

        const comment = await octokit.rest.issues.createComment({
          issue_number: pr.number,
          body: `<p>${response.object.message}</p>

<table>
<thead>
<tr>
<th>Task Title</th>\
<th>Reason</th>
<th>Current Column</th>
<th>Suggested Column</th>
</tr>
</thead>
<tbody>
${response.object.updates
  .map(
    (update) => `<tr>
<td>${update.taskTitle}</td>
<td>${update.reason}</td>
<td>${update.currentTaskColumnName}</td>
<td>${update.columnName}</td>
</tr>`
  )
  .join("")}
</tbody>
</table>

[Cancel this plan](${getApiUrl()}/api/github/plans/${newPlan.id}/cancel?integrationId=${connectedRepository.integrationId})
					`,
          owner: payload.repository.owner.login,
          repo: payload.repository.name,
        });

        await updatePullRequestPlanCommentId({
          commentId: comment.data.id,
          id: newPlan.id,
        });

        log(
          integration.id,
          "info",
          `Created/Updated plan for PR #${pr.number} in repository ${payload.repository.full_name}`,
          {
            prNumber: pr.number,
            repoId: repositoryId,
          },
          response.usage.inputTokens,
          response.usage.outputTokens
        );
      }
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

  console.log("GitHub access token response:", data);

  // Create the integration with the access token
  const integration = await installIntegration({
    type: "github",
    teamId: teamId!,
    config: {
      token: data.access_token,
      installationId,
    },
  });

  return c.redirect(
    `${getAppUrl()}/dashboard/settings/integrations/${integration.type}`
  );
});

export { app as githubWebhook };
