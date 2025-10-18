import { randomUUID } from "node:crypto";
import type { UIChatMessage } from "@api/ai/types";
import type { IntegrationConfig, IntegrationName } from "@integration/registry";
import { randomColor } from "@mimir/utils/random";
import { relations, type SQL, sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  customType,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgSequence,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  unique,
  vector,
} from "drizzle-orm/pg-core";

export const tsvector = customType<{
  data: string;
}>({
  dataType() {
    return "tsvector";
  },
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const plansEnum = pgEnum("plans", ["starter", "enterprise"]);

export const teams = pgTable("teams", {
  id: text("id")
    .$defaultFn(() => randomUUID())
    .primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  email: text("email").notNull(),
  plan: plansEnum("plan"),
  locale: text("locale").default("en-US").notNull(),
  customerId: text("customer_id"),
  canceledAt: timestamp("canceled_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const users = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull(),
    image: text("image"),
    locale: text("locale"),
    teamId: text("team_id"),
    color: text("color").$defaultFn(() => randomColor()),
    isSystemUser: boolean("is_system_user").default(false).notNull(),
    dateFormat: text("date_format"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    foreignKey({
      name: "user_team_id_fkey",
      columns: [table.teamId],
      foreignColumns: [teams.id],
    }),
  ]
);

export const teamRoleEnum = pgEnum("team_role", ["owner", "member"]);

export const usersOnTeams = pgTable(
  "users_on_teams",
  {
    userId: text("user_id").notNull(),
    teamId: text("team_id").notNull(),
    role: teamRoleEnum().default("member").notNull(),
    description: text("description").default(""),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.teamId],
      name: "users_on_teams_pkey",
    }),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "users_on_teams_team_id_fkey",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "users_on_teams_user_id_fkey",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ]
);

export const usersOnTeamsRelations = relations(usersOnTeams, ({ one }) => ({
  team: one(teams, { fields: [usersOnTeams.teamId], references: [teams.id] }),
  user: one(users, { fields: [usersOnTeams.userId], references: [users.id] }),
}));

export const userInvites = pgTable(
  "user_invites",
  {
    id: text()
      .$defaultFn(() => randomUUID())
      .primaryKey()
      .notNull(),
    email: text().notNull(),
    teamId: text("team_id").notNull(),
    code: text().default("nanoid(24)"),
    invitedBy: text("invited_by").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    index("user_invites_team_id_index").on(table.teamId),
    unique("unique_team_invite").on(table.email, table.teamId),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "user_invites_team_id_fkey",
    }),
    foreignKey({
      columns: [table.invitedBy],
      foreignColumns: [users.id],
      name: "user_invites_invited_by_fkey",
    }),
  ]
);

export const priorityEnum = pgEnum("task_priority", ["low", "medium", "high"]);

export const tasks = pgTable(
  "tasks",
  {
    id: text("id")
      .$defaultFn(() => randomUUID())
      .primaryKey()
      .notNull(),
    title: text("title").notNull(),
    sequence: integer("sequence"),
    description: text("description"),
    priority: priorityEnum("priority").default("medium").notNull(),
    assigneeId: text("assignee_id"),
    teamId: text("team_id").notNull(),
    order: integer("order").default(0).notNull(),
    columnId: text("column_id").notNull(),
    attachments: jsonb("attachments").$type<string[]>().default([]),
    pullRequestPlanId: text("pull_request_plan_id"),
    score: integer("score").default(1).notNull(),
    fts: tsvector("fts").generatedAlwaysAs(
      (): SQL =>
        sql`to_tsvector('english', coalesce("title",'') || ' ' || coalesce("description",''))`
    ),
    dueDate: timestamp("due_date", {
      withTimezone: true,
      mode: "string",
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    index("tasks_fts").using(
      "gin",
      table.fts.asc().nullsLast().op("tsvector_ops")
    ),
    foreignKey({
      columns: [table.assigneeId],
      foreignColumns: [users.id],
      name: "tasks_assignee_id_fkey",
    }),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "tasks_team_id_fkey",
    }),
    foreignKey({
      columns: [table.columnId],
      foreignColumns: [columns.id],
      name: "tasks_column_id_fkey",
    }),
  ]
);

export const taskEmbeddings = pgTable(
  "task_embeddings",
  {
    id: text("id")
      .$defaultFn(() => randomUUID())
      .primaryKey()
      .notNull(),
    taskId: text("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    embedding: vector("embedding", { dimensions: 768 }).notNull(),
    model: text("model").notNull().default("google/gemini-embedding-001"),
  },
  (table) => [
    index("document_tag_embeddings_idx")
      .using("hnsw", table.embedding.asc().nullsLast().op("vector_cosine_ops"))
      .with({ m: "16", ef_construction: "64" }),
    unique("unique_task_embedding_per_team").on(table.taskId, table.teamId),
  ]
);

export const tasksRelations = relations(tasks, ({ one }) => ({
  assignee: one(users, { fields: [tasks.assigneeId], references: [users.id] }),
  team: one(teams, { fields: [tasks.teamId], references: [teams.id] }),
}));

export const usersWithTasksRelations = relations(users, ({ many }) => ({
  tasks: many(tasks),
}));

export const teamsWithTasksRelations = relations(teams, ({ many }) => ({
  tasks: many(tasks),
}));

export const columnTypeEnum = pgEnum("column_type", [
  "done",
  "backlog",
  "normal",
]);

export const columns = pgTable(
  "columns",
  {
    id: text("id")
      .$defaultFn(() => randomUUID())
      .primaryKey()
      .notNull(),
    name: text("name").notNull(),
    teamId: text("team_id").notNull(),
    order: integer("order").default(0).notNull(),
    description: text("description"),
    type: columnTypeEnum("type").default("normal").notNull(),
    isFinalState: boolean("is_final_state").default(false).notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    unique("unique_column_name_per_team").on(table.name, table.teamId),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "columns_team_id_fkey",
    }),
  ]
);

export const tasksWithColumnRelations = relations(tasks, ({ one }) => ({
  column: one(columns, {
    fields: [tasks.columnId],
    references: [columns.id],
  }),
}));

export const tasksOnColumnsRelations = relations(columns, ({ many }) => ({
  tasks: many(tasks),
}));

export const chats = pgTable(
  "chats",
  {
    id: text("id")
      .$defaultFn(() => randomUUID())
      .primaryKey()
      .notNull(),
    teamId: text("team_id").notNull(),
    userId: text("user_id").notNull(),
    title: text("title"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    index("chats_team_id_index").on(table.teamId),
    index("chats_user_id_index").on(table.userId),
  ]
);

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: text("id")
      .$defaultFn(() => randomUUID())
      .primaryKey()
      .notNull(),
    chatId: text("chat_id").notNull(),
    teamId: text("team_id").notNull(),
    userId: text("user_id").notNull(),
    content: jsonb("content").$type<UIChatMessage>().notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    index("chat_messages_chat_id_index").on(table.chatId),
    index("chat_messages_team_id_index").on(table.teamId),
    index("chat_messages_user_id_index").on(table.userId),
  ]
);

export const integrations = pgTable(
  "integrations",
  {
    id: text("id")
      .$defaultFn(() => randomUUID())
      .primaryKey()
      .notNull(),
    teamId: text("team_id").notNull(),
    name: text("name").notNull(),
    type: text("type").$type<IntegrationName>().notNull(),
    config: jsonb("config").$type<IntegrationConfig>().notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "integrations_team_id_fkey",
    }),
  ]
);

export const integrationsRelations = relations(integrations, ({ one }) => ({
  team: one(teams, { fields: [integrations.teamId], references: [teams.id] }),
}));

export const teamsWithIntegrationsRelations = relations(teams, ({ many }) => ({
  integrations: many(integrations),
}));

export const integrationLogs = pgTable("integration_logs", {
  id: text("id")
    .$defaultFn(() => randomUUID())
    .primaryKey()
    .notNull(),
  integrationId: text("integration_id").notNull(),
  level: text("level").notNull(),
  message: text("message").notNull(),
  details: jsonb("details"),
  inputTokens: integer("input_tokens"),
  outputTokens: integer("output_tokens"),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow(),
});

export const integrationUserLink = pgTable(
  "integration_user_link",
  {
    id: text("id")
      .$defaultFn(() => randomUUID())
      .primaryKey()
      .notNull(),
    userId: text("user_id").notNull(),
    externalUserId: text("external_user_id").notNull(),
    externalUserName: text("external_user_name").notNull(),
    integrationId: text("integration_id").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    unique("unique_integration_user").on(
      table.integrationId,
      table.userId,
      table.externalUserId
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "integration_user_link_user_id_fkey",
    }),
  ]
);

export const labels = pgTable(
  "labels",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    name: text().notNull(),
    description: text(),
    color: text().notNull(),
    teamId: text("team_id").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "labels_team_id_fkey",
    }),
  ]
);

export const labelsOnTasks = pgTable(
  "labels_on_tasks",
  {
    labelId: text("label_id").notNull(),
    taskId: text("task_id").notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.labelId, table.taskId],
      name: "labels_on_tasks_pkey",
    }),
    foreignKey({
      columns: [table.labelId],
      foreignColumns: [labels.id],
      name: "labels_on_tasks_label_id_fkey",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    foreignKey({
      columns: [table.taskId],
      foreignColumns: [tasks.id],
      name: "labels_on_tasks_task_id_fkey",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ]
);

export const activityTypeEnum = pgEnum("activity_type", [
  // User actions
  "task_column_changed",
  "task_created",
  "task_updated",
  "task_comment",
  "task_assigned",
]);

export const activities = pgTable(
  "activities",
  {
    id: text("id")
      .$defaultFn(() => randomUUID())
      .primaryKey()
      .notNull(),
    userId: text("user_id"),
    teamId: text("team_id").notNull(),
    groupId: text("group_id"),
    type: activityTypeEnum("type").notNull(),
    metadata: jsonb("metadata").$type<Record<string, any>>(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "activity_log_user_id_fkey",
    }),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "activity_log_team_id_fkey",
    }),
  ]
);

export const githubRepositoryConnected = pgTable(
  "github_repository_connected",
  {
    id: text("id")
      .$defaultFn(() => randomUUID())
      .primaryKey()
      .notNull(),
    installationId: integer("installation_id").notNull(),
    teamId: text("team_id").notNull(),
    repositoryId: integer("repository_id").notNull(),
    repositoryName: text("repository_name").notNull(),
    integrationId: text("integration_id").notNull(),
    branches: jsonb("branches")
      .$type<string[]>()
      .default(sql`'[]'::jsonb`),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    unique("unique_github_repo_per_team").on(table.teamId, table.repositoryId),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "github_repository_connected_team_id_fkey",
    }),
    foreignKey({
      columns: [table.integrationId],
      foreignColumns: [integrations.id],
      name: "github_repository_connected_integration_id_fkey",
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ]
);

export const pullRequestPlanStatus = pgEnum("pull_request_plan_status", [
  "pending",
  "completed",
  "canceled",
  "error",
]);

export const pullRequestPlan = pgTable("pull_request_plans", {
  id: text("id")
    .$defaultFn(() => randomUUID())
    .primaryKey()
    .notNull(),
  teamId: text("team_id").notNull(),
  prNumber: bigint("pr_number", {
    mode: "number",
  }).notNull(),
  repoId: bigint("repo_id", {
    mode: "number",
  }).notNull(),
  plan: jsonb("plan").$type<{ taskId: string; columnId: string }[]>().notNull(),
  commentId: bigint("comment_id", {
    mode: "number",
  }),
  prUrl: text("url"),
  prTitle: text("title"),
  headCommitSha: text("head_commit_sha").notNull(),
  status: pullRequestPlanStatus("status").default("pending").notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow(),
});

export const importStatusEnum = pgEnum("task_import_status", [
  "pending",
  "processing",
  "completed",
  "failed",
]);

export const importTypeEnum = pgEnum("import_type", ["tasks_csv"]);

export const imports = pgTable("imports", {
  id: text("id")
    .$defaultFn(() => randomUUID())
    .primaryKey()
    .notNull(),
  teamId: text("team_id").notNull(),
  userId: text("user_id").notNull(),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url"),
  filePath: text("file_path").notNull(),
  error: jsonb("error").$type<{ message: string }>(),
  type: importTypeEnum("type").notNull(),
  status: importStatusEnum("status").default("pending").notNull(),
  jobId: text("job_id"),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  }).defaultNow(),
});

export const notificationSettings = pgTable(
  "notification_settings",
  {
    id: text()
      .$defaultFn(() => randomUUID())
      .primaryKey()
      .notNull(),
    userId: text("user_id").notNull(),
    teamId: text("team_id").notNull(),
    notificationType: text("notification_type").notNull(),
    channel: text("channel").notNull(), // 'in_app', 'email', 'push'
    enabled: boolean().default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("notification_settings_user_team_type_channel_key").on(
      table.userId,
      table.teamId,
      table.notificationType,
      table.channel
    ),
    index("notification_settings_user_team_idx").on(table.userId, table.teamId),
    index("notification_settings_type_channel_idx").on(
      table.notificationType,
      table.channel
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "notification_settings_user_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.teamId],
      foreignColumns: [teams.id],
      name: "notification_settings_team_id_fkey",
    }).onDelete("cascade"),
  ]
);
