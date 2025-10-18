import { and, eq, inArray, type SQL } from "drizzle-orm";
import { db } from "..";
import {
  githubRepositoryConnected,
  pullRequestPlan,
  type pullRequestPlanStatus,
  tasks,
} from "../schema";

export const getConnectedRepositories = async ({
  teamId,
}: {
  teamId?: string;
}) => {
  const whereClause: SQL[] = [];
  if (teamId) {
    whereClause.push(eq(githubRepositoryConnected.teamId, teamId));
  }
  const data = await db
    .select()
    .from(githubRepositoryConnected)
    .where(and(...whereClause));

  return data;
};

export const getConnectedRepositoryByRepoId = async ({
  teamId,
  repositoryId,
}: {
  teamId: string;
  repositoryId: number;
}) => {
  const [record] = await db
    .select()
    .from(githubRepositoryConnected)
    .where(
      and(
        eq(githubRepositoryConnected.teamId, teamId),
        eq(githubRepositoryConnected.repositoryId, repositoryId)
      )
    );
  return record;
};

export const connectRepository = async ({
  teamId,
  installationId,
  repositoryId,
  repositoryName,
  integrationId,
}: {
  teamId: string;
  installationId: number;
  repositoryId: number;
  repositoryName: string;
  integrationId: string;
}) => {
  const [existing] = await db
    .select()
    .from(githubRepositoryConnected)
    .where(
      and(
        eq(githubRepositoryConnected.teamId, teamId),
        eq(githubRepositoryConnected.repositoryId, repositoryId)
      )
    );

  if (existing) {
    return existing;
  }

  const [record] = await db
    .insert(githubRepositoryConnected)
    .values({
      teamId,
      repositoryId,
      repositoryName,
      integrationId,
      installationId,
    })
    .returning();

  return record;
};

export const updateConnectedRepository = async ({
  id,
  teamId,
  branches,
}: {
  id: string;
  teamId?: string;
  branches?: string[];
}) => {
  const whereClause: SQL[] = [eq(githubRepositoryConnected.id, id)];
  if (teamId) {
    whereClause.push(eq(githubRepositoryConnected.teamId, teamId));
  }

  const [record] = await db
    .update(githubRepositoryConnected)
    .set({
      branches,
    })
    .where(and(...whereClause))
    .returning();

  return record;
};

export const disconnectRepository = async ({
  teamId,
  repositoryId,
}: {
  teamId: string;
  repositoryId: number;
}) => {
  const [record] = await db
    .delete(githubRepositoryConnected)
    .where(
      and(
        eq(githubRepositoryConnected.teamId, teamId),
        eq(githubRepositoryConnected.repositoryId, repositoryId)
      )
    )
    .returning();

  return record;
};

export const getConnectedRepositoryByInstallationId = async ({
  installationId,
  repoId,
}: {
  installationId: number;
  repoId: number;
}) => {
  const [record] = await db
    .select()
    .from(githubRepositoryConnected)
    .where(
      and(
        eq(githubRepositoryConnected.installationId, installationId),
        eq(githubRepositoryConnected.repositoryId, repoId)
      )
    );
  return record;
};

export const upsertPullRequestPlan = async ({
  prNumber,
  teamId,
  repoId,
  status,
  prUrl,
  prTitle,
  commentId,
  headCommitSha,
  plan,
}: {
  prNumber: number;
  teamId: string;
  repoId: number;
  commentId?: number;
  prUrl?: string;
  prTitle?: string;
  status?: (typeof pullRequestPlanStatus.enumValues)[number];
  headCommitSha: string;
  plan: {
    taskId: string;
    columnId: string;
  }[];
}) => {
  const shouldUpdateTasks = plan.length > 0;

  const [existing] = await db
    .select()
    .from(pullRequestPlan)
    .where(
      and(
        eq(pullRequestPlan.teamId, teamId),
        eq(pullRequestPlan.repoId, repoId),
        eq(pullRequestPlan.prNumber, prNumber)
      )
    );

  if (existing) {
    //remove associeted tasks pullRequestPlanId
    if (shouldUpdateTasks)
      await db
        .update(tasks)
        .set({
          pullRequestPlanId: null,
        })
        .where(eq(tasks.pullRequestPlanId, existing.id));

    const [record] = await db
      .update(pullRequestPlan)
      .set({
        plan,
        headCommitSha,
        commentId: commentId || existing.commentId,
        status: status || existing.status,
        prUrl: prUrl || existing.prUrl,
        prTitle: prTitle || existing.prTitle,
      })
      .where(eq(pullRequestPlan.id, existing.id))
      .returning();

    if (!record) {
      throw new Error("Failed to update pull request plan");
    }

    // Re-associate tasks with the updated pull request plan
    if (shouldUpdateTasks) {
      const batch = [];
      for (const item of plan) {
        batch.push(
          db
            .update(tasks)
            .set({
              pullRequestPlanId: record.id,
            })
            .where(eq(tasks.id, item.taskId))
        );
      }
      await Promise.all(batch);
    }

    return record;
  }

  const [record] = await db
    .insert(pullRequestPlan)
    .values({
      teamId,
      repoId,
      prNumber,
      commentId,
      headCommitSha,
      prUrl,
      prTitle,
      status: status || "pending",
      plan,
    })
    .returning();

  if (!record) {
    throw new Error("Failed to create pull request plan");
  }

  const batch = [];
  for (const item of plan) {
    batch.push(
      db
        .update(tasks)
        .set({
          pullRequestPlanId: record.id,
        })
        .where(eq(tasks.id, item.taskId))
    );
  }
  await Promise.all(batch);

  return record;
};

export const updatePullRequestPlanStatus = async ({
  id,
  status,
}: {
  id: string;
  status: (typeof pullRequestPlanStatus.enumValues)[number];
}) => {
  const [record] = await db
    .update(pullRequestPlan)
    .set({
      status,
    })
    .where(eq(pullRequestPlan.id, id))
    .returning();

  return record;
};

export const getPullRequestPlanByHead = async ({
  headCommitSha,
  teamId,
  repoId,
}: {
  headCommitSha: string;
  teamId: string;
  repoId: number;
}) => {
  const [record] = await db
    .select()
    .from(pullRequestPlan)
    .where(
      and(
        eq(pullRequestPlan.teamId, teamId),
        eq(pullRequestPlan.repoId, repoId),
        eq(pullRequestPlan.headCommitSha, headCommitSha)
      )
    );
  return record;
};

export const getPullRequestPlanByPrId = async ({
  prNumber,
  teamId,
  repoId,
}: {
  prNumber: number;
  teamId: string;
  repoId: number;
}) => {
  const [record] = await db
    .select()
    .from(pullRequestPlan)
    .where(
      and(
        eq(pullRequestPlan.teamId, teamId),
        eq(pullRequestPlan.repoId, repoId),
        eq(pullRequestPlan.prNumber, prNumber)
      )
    )
    .limit(1);
  return record;
};

export const getPullRequestPlanById = async ({
  id,
  teamId,
}: {
  id: string;
  teamId?: string;
}) => {
  const whereClause: SQL[] = [eq(pullRequestPlan.id, id)];
  if (teamId) {
    whereClause.push(eq(pullRequestPlan.teamId, teamId));
  }

  const [record] = await db
    .select()
    .from(pullRequestPlan)
    .where(and(...whereClause))
    .limit(1);
  return record;
};

export const updatePullRequestPlanCommentId = async ({
  id,
  commentId,
}: {
  id: string;
  commentId: number;
}) => {
  const [record] = await db
    .update(pullRequestPlan)
    .set({
      commentId,
    })
    .where(eq(pullRequestPlan.id, id))
    .returning();

  return record;
};

export const cancelPullRequestPlan = async ({
  id,
  teamId,
}: {
  id: string;
  teamId?: string;
}) => {
  const whereClause: SQL[] = [eq(pullRequestPlan.id, id)];
  if (teamId) {
    whereClause.push(eq(pullRequestPlan.teamId, teamId));
  }

  const [record] = await db
    .update(pullRequestPlan)
    .set({
      status: "canceled",
    })
    .where(and(...whereClause))
    .returning();

  // Disassociate tasks from the canceled pull request plan
  await db
    .update(tasks)
    .set({
      pullRequestPlanId: null,
    })
    .where(eq(tasks.pullRequestPlanId, id));

  return record;
};

export const removeTasksFromPullRequestPlan = async ({
  id,
  teamId,
  taskIds,
}: {
  id: string;
  teamId?: string;
  taskIds: string[];
}) => {
  const whereClause: SQL[] = [eq(pullRequestPlan.id, id)];
  if (teamId) {
    whereClause.push(eq(pullRequestPlan.teamId, teamId));
  }

  const [existing] = await db
    .select()
    .from(pullRequestPlan)
    .where(and(...whereClause))
    .limit(1);

  if (!existing) {
    throw new Error("Pull request plan not found");
  }

  const updatedPlan = existing.plan.filter(
    (item) => !taskIds.includes(item.taskId)
  );

  const [record] = await db
    .update(pullRequestPlan)
    .set({
      plan: updatedPlan,
    })
    .where(eq(pullRequestPlan.id, id))
    .returning();

  // Disassociate the task from the pull request plan
  await db
    .update(tasks)
    .set({
      pullRequestPlanId: null,
    })
    .where(and(eq(tasks.pullRequestPlanId, id), inArray(tasks.id, taskIds)));

  return record;
};
