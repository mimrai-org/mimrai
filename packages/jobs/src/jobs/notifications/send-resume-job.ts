import { getDb } from "@jobs/init";
import { createActivity } from "@mimir/db/queries/activities";
import {
  activities,
  columns,
  resumeSettings,
  tasks,
  teams,
  users,
  usersOnTeams,
} from "@mimir/db/schema";
import { getTaskMarkdownLink } from "@mimir/utils/tasks";
import { logger, metadata, schedules, schemaTask } from "@trigger.dev/sdk";
import { generateText } from "ai";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  isNotNull,
  max,
  sql,
} from "drizzle-orm";
import { act } from "react";
import z from "zod";
import { sendNotificationJob } from "./send-notification-job";

export const sendResumeJob = schedules.task({
  id: "send-resume",
  description: "Send resume job",
  run: async (payload, ctx) => {
    if (!payload.externalId) {
      throw new Error("No externalId provided");
    }

    const db = getDb();
    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, payload.externalId))
      .limit(1);

    if (!team) {
      throw new Error(`No team found with id ${payload.externalId}`);
    }

    const [settings] = await db
      .select()
      .from(resumeSettings)
      .where(
        and(
          eq(resumeSettings.teamId, team.id),
          eq(resumeSettings.enabled, true)
        )
      )
      .limit(1);

    if (!settings) {
      logger.info(
        `No resume settings found for team ${team.id} with jobId ${ctx.ctx.task.id}`
      );
      return;
    }

    const lastResumeDate = settings.lastRunAt
      ? new Date(settings.lastRunAt)
      : new Date("1970-01-01T00:00:00Z");

    const teamActivities = await db
      .select()
      .from(activities)
      .where(
        and(
          eq(activities.teamId, team.id),
          inArray(activities.type, ["task_created"]),
          gte(activities.createdAt, lastResumeDate.toISOString()),
          isNotNull(activities.groupId)
        )
      )
      .leftJoin(users, eq(activities.userId, users.id))
      .innerJoin(tasks, eq(activities.groupId, tasks.id))
      .orderBy(desc(activities.createdAt))
      .limit(50);

    const columnChangeActivities = await db
      .selectDistinctOn([activities.groupId])
      .from(activities)
      .where(
        and(
          eq(activities.teamId, team.id),
          eq(activities.type, "task_column_changed"),
          gte(activities.createdAt, lastResumeDate.toISOString()),
          isNotNull(activities.groupId)
        )
      )
      .leftJoin(users, eq(activities.userId, users.id))
      .innerJoin(tasks, eq(activities.groupId, tasks.id))
      .orderBy(asc(activities.groupId), desc(activities.createdAt))
      .limit(50);

    console.log(columnChangeActivities);

    const teamColumns = await db
      .select({
        id: columns.id,
        name: columns.name,
        type: columns.type,
      })
      .from(columns)
      .where(eq(columns.teamId, team.id))
      .limit(50);

    const members = await db
      .select({
        id: users.id,
        name: users.name,
      })
      .from(usersOnTeams)
      .where(eq(usersOnTeams.teamId, team.id))
      .innerJoin(users, eq(users.id, usersOnTeams.userId))
      .limit(50);

    const activitiesContext = [...teamActivities, ...columnChangeActivities]
      .map((activity) => {
        if (!activity.tasks) return null;
        const userName = activity.user ? activity.user.name : "Unknown user";
        const taskTitle = activity.tasks.title
          ? activity.tasks.title
          : "Unknown task";
        const taskId = activity.tasks.id;
        const createdAt = new Date(
          activity.activities.createdAt!
        ).toLocaleDateString();

        if (activity.activities.type === "task_created") {
          return `- Task "${getTaskMarkdownLink(taskId, taskTitle)}" was created by ${userName} on ${createdAt}.`;
        }

        if (activity.activities.type === "task_column_changed") {
          const newColumn = teamColumns.find(
            (col) => col.id === activity.activities.metadata?.toColumnId
          );
          let newValue = newColumn?.name || "Unknown column (maybe deleted)";

          // Append column type info
          if (newColumn) {
            newValue = `${newValue} (type: ${newColumn.type})`;
          }
          return `- Task "${getTaskMarkdownLink(taskId, taskTitle)}" moved to "${newValue}" by ${userName} on ${createdAt}.`;
          // return `- Task "${getTaskMarkdownLink(taskId, taskTitle)}" was moved to ${activity.activities.metadata?.columnName} column by ${userName} on ${createdAt}.`;
        }

        if (activity.activities.type === "task_updated") {
          const changes =
            activity.activities.metadata?.changes || "No details provided";
          const changesText = Object.keys(changes)
            .map((key) => {
              let oldValue = changes[key].oldValue;
              let newValue = changes[key].value;
              if (key === "assigneeId") {
                oldValue =
                  members.find((member) => member.id === changes[key].oldValue)
                    ?.name || "Unassigned";
                newValue =
                  members.find((member) => member.id === changes[key].value)
                    ?.name || "Unassigned";
              }

              return `- ${key}: "${oldValue}" => "${newValue}"`;
            })
            .join("\n");
          return `- Task "${getTaskMarkdownLink(taskId, taskTitle)}" was updated by ${userName} on ${createdAt}.\n\tChanges:\n${changesText}`;
        }

        return null;
      })
      .filter(Boolean);

    console.log(activitiesContext);

    const text = await generateText({
      model: "openai/gpt-4o",
      prompt: `You are Mimir, a helpful assistant. Provide a concise summary of the following activities for the team ${team.name}.

      Activities (one per line):
      ${activitiesContext.length > 0 ? activitiesContext.join("\n") : "No activities found."}
        

      RESPONSE GUIDELINES:
      - The summary should focus on the progress made in the tasks.
      - Use bullet points for clarity.
      - Be precise, use the task titles wherever possible.
      - Use markdown formatting.
      - Do not ask for more information. Just provide the summary based on the activities provided.
      - If a column is of type "done" it means the task is completed, do not mention the column, say the task is finished (THIS IS IMPORTANT), and congratulate the user.
      - Group the activities by team members
      - Respect the markdown links provided in the activities.

      RESPONSE TEMPLATE (This is a format example, do not copy the content):
      {insert salute here}:
      Alice:
        - Task "Design Homepage" was created on 2024-10-01.
      Bob:
        - Task "Implement Authentication" was finished on 2024-10-02.
        - Task "Set up Database" was moved to "In Progress" on 2024-10-03.


      {add a brief summary of the overall progress, you can focus on the completed tasks and their impact}.
      {insert motivational note here based on the activities}.

      IMPORTANT: Always respond in ${team.locale} language.
      `,
    });

    const activity = await createActivity({
      teamId: team.id,
      type: "resume_generated",
      metadata: {
        summary: text.text,
      },
      groupId: settings.id,
    });

    if (!activity) {
      throw new Error("Failed to create activity for resume generation");
    }

    await sendNotificationJob.trigger({
      activityId: activity.id,
      channel: "mattermost",
    });

    await db
      .update(resumeSettings)
      .set({
        lastRunAt: new Date().toISOString(),
      })
      .where(eq(resumeSettings.id, settings.id));
  },
});
