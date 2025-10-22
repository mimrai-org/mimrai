import {
  cancelPullRequestPlan,
  getConnectedRepositoryByRepoId,
  getPullRequestPlanById,
} from "@db/queries/github";
import { getIntegrationById } from "@db/queries/integrations";
import { switchTeam } from "@db/queries/users";
import { OpenAPIHono } from "@hono/zod-openapi";
import { getAppUrl } from "@mimir/utils/envs";
import { Octokit } from "octokit";
import type { Context } from "../types";

const app = new OpenAPIHono<Context>();

app.get("/plans/:planId/cancel", async (c) => {
  const { planId } = c.req.param();
  const session = c.get("session");
  const { integrationId } = c.req.query();

  const plan = await getPullRequestPlanById({
    id: planId,
  });

  if (!plan) {
    return c.json({ success: false }, 404);
  }

  const user = await switchTeam(session.userId, plan.teamId);

  const integration = await getIntegrationById({
    id: integrationId,
    teamId: user.teamId,
  });

  if (!integration) {
    return c.json({ success: false }, 404);
  }

  const connectedRepository = await getConnectedRepositoryByRepoId({
    repositoryId: plan.repoId,
    teamId: user.teamId,
  });

  if (!connectedRepository) {
    return c.json({ success: false }, 404);
  }

  const octokit = new Octokit({
    auth: integration.config.token,
  });

  await cancelPullRequestPlan({
    id: planId,
    teamId: user.teamId,
  });

  await octokit.rest.issues.updateComment({
    owner: connectedRepository.repositoryName.split("/")[0],
    repo: connectedRepository.repositoryName.split("/")[1],
    comment_id: plan.commentId,
    body: `The plan has been canceled by ${user.name}. To re-create the plan, you can reopen the pull request or push new commits.`,
  });

  const url = new URL(`${getAppUrl()}/dashboard/pr-plan-canceled`);
  url.searchParams.append("pullRequestPlanId", planId);

  return c.redirect(url);
});

export { app as githubRouter };
