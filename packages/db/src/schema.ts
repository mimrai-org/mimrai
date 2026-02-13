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
	numeric,
	pgEnum,
	pgTable,
	primaryKey,
	smallint,
	text,
	timestamp,
	unique,
	vector,
} from "drizzle-orm/pg-core";
import type { CreateTaskInput } from "./queries/tasks";
import { buildGlobalSearchView } from "./utils/global-search-view";

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
	metadata: jsonb("metadata").$type<Record<string, any>>(),
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

// API Key table (for MCP authentication)
export const apikey = pgTable("apikey", {
	id: text("id")
		.$defaultFn(() => randomUUID())
		.primaryKey(),
	name: text("name"),
	start: text("start"),
	prefix: text("prefix"),
	key: text("key").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	// Team ID for team-scoped API keys
	teamId: text("team_id").references(() => teams.id, { onDelete: "cascade" }),
	refillInterval: integer("refill_interval"),
	refillAmount: integer("refill_amount"),
	lastRefillAt: timestamp("last_refill_at"),
	enabled: boolean("enabled").default(true).notNull(),
	rateLimitEnabled: boolean("rate_limit_enabled").default(true).notNull(),
	rateLimitTimeWindow: integer("rate_limit_time_window"),
	rateLimitMax: integer("rate_limit_max"),
	requestCount: integer("request_count").default(0).notNull(),
	remaining: integer("remaining"),
	lastRequest: timestamp("last_request"),
	expiresAt: timestamp("expires_at"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
	permissions: text("permissions"),
	metadata: jsonb("metadata").$type<Record<string, any>>(),
});

export const plansEnum = pgEnum("plans", ["free", "team"]);

export const creditMovementTypeEnum = pgEnum("credit_movement_type", [
	"purchase",
	"usage",
	"refund",
	"adjustment",
	"promo",
]);

export const teams = pgTable("teams", {
	id: text("id")
		.$defaultFn(() => randomUUID())
		.primaryKey(),
	name: text("name").notNull(),
	slug: text("slug").notNull().unique(),
	prefix: text("prefix").notNull(),
	description: text("description"),
	email: text("email").notNull(),
	plan: plansEnum("plan"),
	subscriptionId: text("subscription_id"),
	timezone: text("timezone").default("UTC").notNull(),
	locale: text("locale").default("en-US").notNull(),
	customerId: text("customer_id"),
	canceledAt: timestamp("canceled_at"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const creditBalance = pgTable(
	"credit_balance",
	{
		id: text("id")
			.$defaultFn(() => randomUUID())
			.primaryKey(),
		teamId: text("team_id")
			.notNull()
			.references(() => teams.id, { onDelete: "cascade" }),
		balanceCents: integer("balance_cents").notNull().default(0),
		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		unique("unique_credit_balance_per_team").on(table.teamId),
		index("credit_balance_team_id_index").on(table.teamId),
	],
);

export const creditLedger = pgTable(
	"credit_ledger",
	{
		id: text("id")
			.$defaultFn(() => randomUUID())
			.primaryKey(),
		teamId: text("team_id")
			.notNull()
			.references(() => teams.id, { onDelete: "cascade" }),
		type: creditMovementTypeEnum("type").notNull(),
		amountCents: integer("amount_cents").notNull(),
		stripePaymentIntentId: text("stripe_payment_intent_id"),
		stripeEventId: text("stripe_event_id").unique(),
		metadata: jsonb("metadata").$type<Record<string, unknown>>(),
		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index("credit_ledger_team_id_index").on(table.teamId),
		index("credit_ledger_type_index").on(table.type),
		index("credit_ledger_stripe_payment_intent_id_index").on(
			table.stripePaymentIntentId,
		),
		index("credit_ledger_created_at_index").on(table.createdAt),
	],
);

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
		teamSlug: text("team_slug"),
		isMentionable: boolean("is_mentionable").default(true).notNull(),
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
		}).onDelete("set null"),
	],
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
	],
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
		}).onDelete("cascade"),
		foreignKey({
			columns: [table.invitedBy],
			foreignColumns: [users.id],
			name: "user_invites_invited_by_fkey",
		}),
	],
);

export const priorityEnum = pgEnum("task_priority", [
	"low",
	"medium",
	"high",
	"urgent",
]);

export const tasks = pgTable(
	"tasks",
	{
		id: text("id")
			.$defaultFn(() => randomUUID())
			.primaryKey()
			.notNull(),
		permalinkId: text("permalink_id").notNull().unique(),
		title: text("title").notNull(),
		sequence: integer("sequence"),
		description: text("description"),
		priority: priorityEnum("priority").default("medium").notNull(),
		assigneeId: text("assignee_id"),
		createdBy: text("created_by"),
		teamId: text("team_id").notNull(),
		order: numeric("order", {
			precision: 100,
			scale: 5,
			mode: "number",
		}).notNull(),
		statusId: text("status_id").notNull(),
		attachments: jsonb("attachments").$type<string[]>().default([]),
		score: integer("score").default(1).notNull(),
		repositoryName: text("repository_name"),
		branchName: text("branch_name"),
		fts: tsvector("fts").generatedAlwaysAs(
			(): SQL =>
				sql`to_tsvector('english', coalesce("title",'') || ' ' || coalesce("description",''))`,
		),
		dueDate: timestamp("due_date", {
			withTimezone: true,
			mode: "string",
		}),
		subscribers: text("subscribers").array().default([]).notNull(),
		mentions: text("mentions").array().default([]).notNull(),
		projectId: text("project_id"),
		milestoneId: text("milestone_id"),

		prReviewId: text("pr_review_id"),

		focusOrder: smallint("focus_order"),
		focusReason: text("focus_reason"),

		recurring: jsonb("recurring").$type<{
			frequency: "daily" | "weekly" | "monthly" | "yearly";
			interval: number;
			startDate?: string;
		}>(),
		recurringJobId: text("recurring_job_id"),
		recurringNextDate: timestamp("recurring_next_date", {
			withTimezone: true,
			mode: "string",
		}),

		completedAt: timestamp("completed_at", {
			withTimezone: true,
		}),
		completedBy: text("completed_by"),

		statusChangedAt: timestamp("status_changed_at", {
			withTimezone: true,
		}).defaultNow(),

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
			table.fts.asc().nullsLast().op("tsvector_ops"),
		),
		index("tasks_order_index").on(table.order),
		index("tasks_sequence_index").on(table.sequence),
		index("tasks_permalink_id_index").on(table.permalinkId),
		index("tasks_team_id_index").using("btree", table.teamId),
		index("tasks_assignee_id_index").using("btree", table.assigneeId),
		foreignKey({
			columns: [table.completedBy],
			foreignColumns: [users.id],
			name: "tasks_completed_by_fkey",
		}).onDelete("set null"),
		foreignKey({
			columns: [table.assigneeId],
			foreignColumns: [users.id],
			name: "tasks_assignee_id_fkey",
		}).onDelete("set null"),
		foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "tasks_created_by_fkey",
		}).onDelete("set null"),
		foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "tasks_team_id_fkey",
		}).onDelete("cascade"),
		foreignKey({
			columns: [table.statusId],
			foreignColumns: [statuses.id],
			name: "tasks_column_id_fkey",
		}),
		foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "tasks_project_id_fkey",
		}).onDelete("cascade"),
		foreignKey({
			columns: [table.milestoneId],
			foreignColumns: [milestones.id],
			name: "tasks_milestone_id_fkey",
		}).onDelete("cascade"),
		foreignKey({
			columns: [table.prReviewId],
			foreignColumns: [prReviews.id],
			name: "tasks_pr_review_id_fkey",
		}).onDelete("set null"),
	],
);

export const taskDependencyTypeEnum = pgEnum("task_dependency_type", [
	"blocks",
	"relates_to",
]);

export const tasksDependencies = pgTable(
	"tasks_dependencies",
	{
		taskId: text("task_id").notNull(),
		dependsOnTaskId: text("depends_on_task_id").notNull(),
		type: taskDependencyTypeEnum("type").default("relates_to").notNull(),
		explanation: text("explanation"),
	},
	(table) => [
		primaryKey({
			columns: [table.taskId, table.dependsOnTaskId],
			name: "tasks_dependencies_pkey",
		}),
		index("tasks_dependencies_task_id_index").using("btree", table.taskId),
		foreignKey({
			columns: [table.taskId],
			foreignColumns: [tasks.id],
			name: "tasks_dependencies_task_id_fkey",
		}),
		foreignKey({
			columns: [table.dependsOnTaskId],
			foreignColumns: [tasks.id],
			name: "tasks_dependencies_depends_on_task_id_fkey",
		}),
	],
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
	],
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

export const teamsWithCreditsRelations = relations(teams, ({ many, one }) => ({
	creditLedger: many(creditLedger),
	creditBalance: one(creditBalance, {
		fields: [teams.id],
		references: [creditBalance.teamId],
	}),
}));

export const statusTypeEnum = pgEnum("status_type", [
	"done",
	"backlog",
	"to_do",
	"in_progress",
	"review",
]);

export const statuses = pgTable(
	"statuses",
	{
		id: text("id")
			.$defaultFn(() => randomUUID())
			.primaryKey()
			.notNull(),
		name: text("name").notNull(),
		teamId: text("team_id").notNull(),
		order: integer("order").default(0).notNull(),
		description: text("description"),
		type: statusTypeEnum("type").default("in_progress").notNull(),
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
		unique("unique_status_name_per_team").on(table.name, table.teamId),
		foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "statuses_team_id_fkey",
		}).onDelete("cascade"),
	],
);

export const tasksWithColumnRelations = relations(tasks, ({ one }) => ({
	column: one(statuses, {
		fields: [tasks.statusId],
		references: [statuses.id],
	}),
}));

export const tasksOnColumnsRelations = relations(statuses, ({ many }) => ({
	tasks: many(tasks),
}));

export const workingMemory = pgTable("working_memory", {
	id: text("id").primaryKey().notNull(),
	chatId: text("chat_id").notNull(),
	userId: text("user_id").notNull(),
	content: text("content").notNull(),
	updatedAt: timestamp("updated_at", {
		withTimezone: true,
	})
		.defaultNow()
		.notNull(),
});

export const chats = pgTable(
	"chats",
	{
		id: text("id")
			.$defaultFn(() => randomUUID())
			.primaryKey()
			.notNull(),
		teamId: text("team_id"),
		userId: text("user_id").notNull(),
		title: text("title"),
		summary: text("summary"),
		lastSummaryAt: timestamp("last_summary_at", {
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
		index("chats_team_id_index").on(table.teamId),
		index("chats_user_id_index").on(table.userId),
	],
);

export const chatMessages = pgTable(
	"chat_messages",
	{
		id: text("id")
			.$defaultFn(() => randomUUID())
			.primaryKey()
			.notNull(),
		chatId: text("chat_id").notNull(),
		userId: text("user_id").notNull(),
		role: text("role"),
		content: jsonb("content").$type<UIChatMessage>().notNull(),
		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		index("chat_messages_chat_id_index").on(table.chatId),
		index("chat_messages_user_id_index").on(table.userId),
	],
);

export const integrations = pgTable(
	"integrations",
	{
		id: text("id")
			.$defaultFn(() => randomUUID())
			.primaryKey()
			.notNull(),
		teamId: text("team_id").notNull(),
		externalTeamId: text("external_team_id"),
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
	],
);

export const integrationsRelations = relations(integrations, ({ one }) => ({
	team: one(teams, { fields: [integrations.teamId], references: [teams.id] }),
}));

export const teamsWithIntegrationsRelations = relations(teams, ({ many }) => ({
	integrations: many(integrations),
}));

export const integrationLogsLevelEnum = pgEnum("integration_logs_level", [
	"info",
	"warning",
	"error",
]);

export const integrationLogs = pgTable(
	"integration_logs",
	{
		id: text("id")
			.$defaultFn(() => randomUUID())
			.primaryKey()
			.notNull(),
		key: text("key").notNull(),
		integrationId: text("integration_id").notNull(),
		level: integrationLogsLevelEnum("level").notNull(),
		message: text("message").notNull(),
		userLinkId: text("integration_user_link_id"),
		details: jsonb("details"),
		inputTokens: integer("input_tokens"),
		outputTokens: integer("output_tokens"),
		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		foreignKey({
			columns: [table.integrationId],
			foreignColumns: [integrations.id],
			name: "integration_logs_integration_id_fkey",
		}).onDelete("cascade"),
		foreignKey({
			columns: [table.userLinkId],
			foreignColumns: [integrationUserLink.id],
			name: "integration_logs_integration_user_link_id_fkey",
		}).onDelete("set null"),
	],
);

export const integrationUserLink = pgTable(
	"integration_user_link",
	{
		id: text("id")
			.$defaultFn(() => randomUUID())
			.primaryKey()
			.notNull(),
		userId: text("user_id").notNull(),
		externalUserId: text("external_user_id").notNull(),
		externalUserName: text("external_user_name"),
		integrationId: text("integration_id"),
		mcpServerId: text("mcp_server_id"),
		integrationType: text("integration_type").$type<IntegrationName>(),
		accessToken: text("access_token"),
		refreshToken: text("refresh_token"),
		config: jsonb("config").$type<Record<string, any>>(),
		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		unique("unique_integration_user").on(
			table.integrationId,
			table.userId,
			table.externalUserId,
		),
		unique("unique_mcp_server_user").on(
			table.mcpServerId,
			table.userId,
			table.externalUserId,
		),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "integration_user_link_user_id_fkey",
		}),
		foreignKey({
			columns: [table.integrationId],
			foreignColumns: [integrations.id],
			name: "integration_user_link_integration_id_fkey",
		}).onDelete("cascade"),
		foreignKey({
			columns: [table.mcpServerId],
			foreignColumns: [mcpServers.id],
			name: "integration_user_link_mcp_server_id_fkey",
		}).onDelete("cascade"),
	],
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
		index("labels_name_team_id_index").using("btree", table.teamId),
		foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "labels_team_id_fkey",
		}).onDelete("cascade"),
	],
);

export const labelsOnTasks = pgTable(
	"labels_on_tasks",
	{
		labelId: text("label_id").notNull(),
		taskId: text("task_id").notNull(),
	},
	(table) => [
		index("labels_on_tasks_task_id_index").using("btree", table.labelId),
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
	],
);

export const activityTypeEnum = pgEnum("activity_type", [
	// User actions
	"task_column_changed",
	"task_completed",
	"task_created",
	"task_updated",
	"task_comment",
	"task_comment_reply",
	"task_assigned",
	"task_execution_started",
	"task_execution_completed",
	"checklist_item_completed",
	"checklist_item_created",
	"checklist_item_updated",
	"mention",
	"resume_generated",
	"daily_digest",
	"daily_pulse",
	"daily_end_of_day",
	"daily_team_summary",
	"follow_up",
]);

export const activitySourceEnum = pgEnum("activity_source", [
	"task",
	"comment",
	"checklist_item",
]);

export const activityStatusEnum = pgEnum("activity_status", [
	"unread",
	"read",
	"archived",
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
		replyToActivityId: text("reply_to_activity_id"),
		source: activitySourceEnum("source"),
		type: activityTypeEnum("type").notNull(),
		metadata: jsonb("metadata").$type<Record<string, any>>(),
		status: activityStatusEnum("status").default("unread").notNull(),
		priority: smallint("priority").default(1).notNull(), // 1-3 = notifications, 4-10 = insights only
		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		index("activity_group_id_index").on(table.groupId),
		index("activity_type_index").on(table.type),
		index("activity_inbox_index").on(
			table.priority,
			table.status,
			table.userId,
		),
		index("activity_team_id_index").using("btree", table.teamId),
		index("activity_created_at_index").using("btree", table.createdAt),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "activity_log_user_id_fkey",
		}).onDelete("set null"),
		foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "activity_log_team_id_fkey",
		}).onDelete("cascade"),
	],
);

export const activityReactions = pgTable(
	"activity_reactions",
	{
		id: text("id")
			.$defaultFn(() => randomUUID())
			.primaryKey()
			.notNull(),
		activityId: text("activity_id").notNull(),
		userId: text("user_id").notNull(),
		reaction: text("reaction").notNull(), // emoji like 👍, ❤️, 😂
		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		index("activity_reactions_activity_id_index").on(table.activityId),
		index("activity_reactions_user_id_index").on(table.userId),
		unique("unique_activity_user_reaction").on(
			table.activityId,
			table.userId,
			table.reaction,
		),
		foreignKey({
			columns: [table.activityId],
			foreignColumns: [activities.id],
			name: "activity_reactions_activity_id_fkey",
		}).onDelete("cascade"),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "activity_reactions_user_id_fkey",
		}).onDelete("cascade"),
	],
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
		branches: jsonb("branches").$type<string[]>().default(sql`'[]'::jsonb`),
		connectedByUserId: text("connected_by_user_id").notNull(),
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
		}).onDelete("cascade"),
		foreignKey({
			columns: [table.integrationId],
			foreignColumns: [integrations.id],
			name: "github_repository_connected_integration_id_fkey",
		})
			.onDelete("cascade")
			.onUpdate("cascade"),
		foreignKey({
			columns: [table.connectedByUserId],
			foreignColumns: [users.id],
			name: "github_repository_connected_connected_by_user_id_fkey",
		}).onDelete("cascade"),
	],
);

/**
 * @deprecated going to be removed
 */
export const pullRequestPlanStatus = pgEnum("pull_request_plan_status", [
	"pending",
	"completed",
	"canceled",
	"error",
]);

/**
 * @deprecated going to be removed
 */
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
	taskId: text("task_id").notNull(),
	statusId: text("status_id").notNull(),
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
			table.channel,
		),
		index("notification_settings_user_team_idx").on(table.userId, table.teamId),
		index("notification_settings_type_channel_idx").on(
			table.notificationType,
			table.channel,
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
	],
);

export const autopilotSettings = pgTable(
	"autopilot_settings",
	{
		id: text()
			.$defaultFn(() => randomUUID())
			.primaryKey()
			.notNull(),
		teamId: text("team_id").notNull(),
		enabled: boolean("enabled").default(false).notNull(),
		allowedWeekdays: integer("allowed_weekdays")
			.array()
			.default([1, 2, 3, 4, 5]), // 0 = Sunday, 6 = Saturday
		enableFollowUps: boolean("enable_follow_ups").default(false),

		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		unique("unique_autopilot_settings_per_team").on(table.teamId),
		foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "autopilot_settings_team_id_fkey",
		}).onDelete("cascade"),
	],
);

/**
 * Tracks the lifecycle of autonomous task execution
 */
export const taskExecutionStatusEnum = pgEnum("task_execution_status", [
	"pending", // Task assigned, waiting for analysis
	"executing", // MIMIR is executing the plan
	"blocked", // Execution blocked (waiting for human subtask, info needed)
	"completed", // Task execution completed successfully
	"failed", // Execution failed
]);

/**
 * Memory/context storage for task execution
 */
export interface TaskExecutionMemory {
	/** Key information gathered from task context */
	summary?: string;
	/** Notes or observations made during execution */
	notes?: string[];
}

/**
 * Tracks autonomous task execution by the agent
 */
export const taskExecutions = pgTable(
	"task_executions",
	{
		id: text("id")
			.$defaultFn(() => randomUUID())
			.primaryKey()
			.notNull(),
		taskId: text("task_id").notNull(),
		teamId: text("team_id").notNull(),

		status: taskExecutionStatusEnum("status").default("pending").notNull(),

		usageMetrics: jsonb("usage_metrics").$type<{
			inputTokens: number;
			outputTokens: number;
			totalTokens: number;
			costUSD: number;
		}>(),

		// Memory slot for task context
		memory: jsonb("memory").$type<TaskExecutionMemory>().default({}),

		contextStale: boolean("context_stale").default(false).notNull(),

		// Content hash
		contentHash: text("content_hash"),

		// Trigger.dev job linkage
		triggerJobId: text("trigger_job_id"),

		lastError: text("last_error"),

		// Timestamps
		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
		completedAt: timestamp("completed_at", {
			withTimezone: true,
			mode: "string",
		}),
	},
	(table) => [
		index("task_executions_task_id_index").on(table.taskId),
		index("task_executions_team_id_index").on(table.teamId),
		index("task_executions_status_index").on(table.status),
		unique("unique_active_task_execution").on(table.taskId), // Only one active execution per task
		foreignKey({
			columns: [table.taskId],
			foreignColumns: [tasks.id],
			name: "task_executions_task_id_fkey",
		}).onDelete("cascade"),
		foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "task_executions_team_id_fkey",
		}).onDelete("cascade"),
	],
);

export const projectExecutionStatusEnum = pgEnum("project_execution_status", [
	"pending", // Project assigned, waiting for analysis
	"executing", // PM agent is actively working
	"idle", // PM is idle, waiting for next trigger
	"blocked", // Execution blocked (waiting for input)
	"completed", // Project execution fully completed
	"failed", // Execution failed
]);

export interface ProjectExecutionMemory {
	/** High-level summary of current project state */
	summary?: string;
	/** Notes or observations made during execution */
	notes?: string[];
	/** High-level project plan / scope summary */
	projectPlan?: string;
	/** Decisions made during project management */
	decisions?: Array<{
		date: string;
		decision: string;
		reason: string;
	}>;
	/** Blockers or risks identified */
	blockers?: Array<{
		description: string;
		taskId?: string;
		status: "open" | "resolved";
	}>;
	/** Milestone completion tracking */
	milestoneProgress?: Record<
		string,
		{
			status: "not_started" | "in_progress" | "completed";
			notes?: string;
		}
	>;
}

export const projectExecutions = pgTable(
	"project_executions",
	{
		id: text("id")
			.$defaultFn(() => randomUUID())
			.primaryKey()
			.notNull(),
		projectId: text("project_id").notNull(),
		teamId: text("team_id").notNull(),

		status: projectExecutionStatusEnum("status").default("pending").notNull(),

		usageMetrics: jsonb("usage_metrics").$type<{
			inputTokens: number;
			outputTokens: number;
			totalTokens: number;
			costUSD: number;
		}>(),

		// Memory slot for PM context that persists across invocations
		memory: jsonb("memory").$type<ProjectExecutionMemory>().default({}),

		contextStale: boolean("context_stale").default(false).notNull(),

		// Trigger.dev job linkage
		triggerJobId: text("trigger_job_id"),

		lastError: text("last_error"),

		// Timestamps
		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
		completedAt: timestamp("completed_at", {
			withTimezone: true,
			mode: "string",
		}),
	},
	(table) => [
		index("project_executions_project_id_index").on(table.projectId),
		index("project_executions_team_id_index").on(table.teamId),
		index("project_executions_status_index").on(table.status),
		unique("unique_active_project_execution").on(table.projectId),
		foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "project_executions_project_id_fkey",
		}).onDelete("cascade"),
		foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "project_executions_team_id_fkey",
		}).onDelete("cascade"),
	],
);

export const agents = pgTable(
	"agents",
	{
		id: text("id")
			.$defaultFn(() => randomUUID())
			.primaryKey()
			.notNull(),
		teamId: text("team_id").notNull(),
		name: text("name").notNull(),
		description: text("description"),
		avatar: text("avatar"),
		isActive: boolean("is_active").default(true).notNull(),
		model: text("model").notNull().default("openai/gpt-5"),
		soul: text("soul"),

		userId: text("user_id").notNull(),
		behalfUserId: text("behalf_user_id"),
		authorizeIntegrations: boolean("authorize_integrations")
			.default(false)
			.notNull(),
		activeToolboxes: text("active_toolboxes").array().default([]).notNull(),

		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index("agents_team_id_index").on(table.teamId),
		foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "agents_team_id_fkey",
		}).onDelete("cascade"),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "agents_user_id_fkey",
		}).onDelete("cascade"),
	],
);

export const checklistItems = pgTable(
	"checklist_items",
	{
		id: text("id")
			.$defaultFn(() => randomUUID())
			.primaryKey()
			.notNull(),

		// Checklist belongs to
		taskId: text("task_id"),

		description: text("description").notNull(),
		isCompleted: boolean("is_completed").default(false).notNull(),
		order: numeric("order", {
			precision: 100,
			scale: 5,
			mode: "number",
		})
			.default(0)
			.notNull(),
		assigneeId: text("assignee_id"),
		teamId: text("team_id").notNull(),
		attachments: jsonb("attachments").$type<string[]>().default([]),

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
		index("checklist_items_task_id_index").using("btree", table.taskId),
		index("checklist_items_team_id_index").using("btree", table.teamId),
		foreignKey({
			columns: [table.taskId],
			foreignColumns: [tasks.id],
			name: "checklist_items_task_id_fkey",
		}).onDelete("cascade"),
		foreignKey({
			columns: [table.assigneeId],
			foreignColumns: [users.id],
			name: "checklist_items_assignee_id_fkey",
		}),
		foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "checklist_items_team_id_fkey",
		}).onDelete("cascade"),
	],
);

export const projectVisibilityEnum = pgEnum("project_visibility", [
	"team",
	"private",
]);

export const projectStatusEnum = pgEnum("project_status", [
	"planning",
	"in_progress",
	"completed",
	"on_hold",
]);

export const projects = pgTable(
	"projects",
	{
		id: text("id")
			.$defaultFn(() => randomUUID())
			.primaryKey()
			.notNull(),
		name: text("name").notNull(),
		description: text("description"),
		color: text("color"),
		archived: boolean("archived").default(false).notNull(),
		teamId: text("team_id").notNull(),
		userId: text("user_id").notNull(),
		leadId: text("lead_id"),
		visibility: projectVisibilityEnum("visibility").default("team").notNull(),
		startDate: timestamp("start_date", {
			withTimezone: true,
			mode: "string",
		}),
		endDate: timestamp("end_date", {
			withTimezone: true,
			mode: "string",
		}),

		status: projectStatusEnum("status").default("planning").notNull(),

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
		unique("unique_project_name_per_team").on(table.name, table.teamId),
		index("projects_team_id_index").using("btree", table.teamId),
		foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "projects_team_id_fkey",
		}).onDelete("cascade"),
		foreignKey({
			columns: [table.leadId],
			foreignColumns: [users.id],
			name: "projects_lead_id_fkey",
		}).onDelete("set null"),
	],
);

export const projectMembers = pgTable(
	"project_members",
	{
		projectId: text("project_id").notNull(),
		userId: text("user_id").notNull(),
		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		primaryKey({
			columns: [table.projectId, table.userId],
			name: "project_members_pkey",
		}),
		foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "project_members_project_id_fkey",
		})
			.onDelete("cascade")
			.onUpdate("cascade"),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "project_members_user_id_fkey",
		})
			.onDelete("cascade")
			.onUpdate("cascade"),
	],
);

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
	project: one(projects, {
		fields: [projectMembers.projectId],
		references: [projects.id],
	}),
	user: one(users, {
		fields: [projectMembers.userId],
		references: [users.id],
	}),
}));

export const projectHealthEnum = pgEnum("project_health", [
	"on_track",
	"at_risk",
	"off_track",
]);

export interface ProjectHealthSnapshot {
	progress: {
		milestones: {
			id: string;
			name: string;
			dueDate: string | null;
			progress: {
				openTasks: number;
				completedTasks: number;
			};
		}[];
		tasks: {
			total: number;
			completed: number;
			open: number;
		};
	};
}

export const projectHealthUpdates = pgTable(
	"project_health_updates",
	{
		id: text("id")
			.$defaultFn(() => randomUUID())
			.primaryKey()
			.notNull(),
		projectId: text("project_id").notNull(),
		teamId: text("team_id").notNull(),
		health: projectHealthEnum("health").notNull(),
		summary: text("summary"),

		snapshot: jsonb("snapshot").$type<ProjectHealthSnapshot>().notNull(),

		createdBy: text("created_by").notNull(),
		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		index("project_health_updates_team_id_index").on(table.teamId),
		foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "project_health_updates_project_id_fkey",
		}).onDelete("cascade"),
		foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "project_health_updates_team_id_fkey",
		}).onDelete("cascade"),
		foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "project_health_updates_created_by_fkey",
		}),
	],
);

export const newsletter = pgTable("newsletter", {
	email: text("email").primaryKey().notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const shareablePolicyEnum = pgEnum("share_policy", [
	"private",
	"public",
]);

export const shareableTypeEnum = pgEnum("shared_resource_type", [
	"task",
	"project",
]);

export const shareable = pgTable(
	"shared_resources",
	{
		id: text("id").primaryKey().notNull(),
		resourceType: shareableTypeEnum("resource_type").notNull(),
		resourceId: text("resource_id").notNull(),
		teamId: text("team_id").notNull(),
		policy: shareablePolicyEnum("policy").default("private").notNull(),
		authorizedEmails: text("authorized_emails").array().default([]).notNull(),
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
		unique("unique_shared_resource_per_team").on(
			table.resourceType,
			table.resourceId,
			table.teamId,
		),
		unique("unique_shared_resource_id").on(table.resourceId),
		index("shared_resources_team_id_index").on(table.teamId),
		index("shared_resources_resource_index").on(
			table.resourceType,
			table.resourceId,
		),
		foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "shared_resources_team_id_fkey",
		}).onDelete("cascade"),
	],
);

export const taskSuggestionsStatusEnum = pgEnum("suggestion_status", [
	"pending",
	"accepted",
	"rejected",
]);

export type TaskSuggestionPayload =
	| {
			type: "move";
			statusId: string;
	  }
	| {
			type: "assign";
			assigneeId: string;
	  }
	| {
			type: "comment";
			comment: string;
	  };

export const taskSuggestions = pgTable(
	"task_suggestions",
	{
		id: text("id")
			.$defaultFn(() => randomUUID())
			.primaryKey()
			.notNull(),
		teamId: text("team_id").notNull(),
		content: text("content").notNull(),
		status: taskSuggestionsStatusEnum("status").default("pending").notNull(),

		taskId: text("task_id").notNull(),
		payload: jsonb("payload").$type<TaskSuggestionPayload>().notNull(),

		// Key to prevent duplicate suggestions
		key: text("key").notNull(),

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
		index("task_suggestions_team_id_index").using("btree", table.teamId),
		index("task_suggestions_created_at_index").using("btree", table.createdAt),
		foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "task_suggestions_team_id_fkey",
		}).onDelete("cascade"),
		foreignKey({
			columns: [table.taskId],
			foreignColumns: [tasks.id],
			name: "task_suggestions_task_id_fkey",
		}).onDelete("cascade"),
	],
);

export const milestones = pgTable(
	"milestones",
	{
		id: text("id")
			.$defaultFn(() => randomUUID())
			.primaryKey()
			.notNull(),
		name: text("name").notNull(),
		description: text("description"),
		dueDate: timestamp("due_date", {
			withTimezone: true,
			mode: "string",
		}),
		color: text("color"),
		teamId: text("team_id").notNull(),
		projectId: text("project_id").notNull(),
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
		unique("unique_milestone_name_per_project").on(table.name, table.projectId),
		foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "milestones_team_id_fkey",
		}).onDelete("cascade"),
		foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "milestones_project_id_fkey",
		}).onDelete("cascade"),
	],
);

export const prReviewStatusEnum = pgEnum("pr_review_status", [
	"pending",
	"closed",
	"approved",
	"changes_requested",
	"reviewed",
	"review_requested",
]);

export const prReviews = pgTable(
	"pr_reviews",
	{
		id: text("id")
			.$defaultFn(() => randomUUID())
			.primaryKey()
			.notNull(),
		teamId: text("team_id").notNull(),
		connectedRepoId: text("connected_repo_id").notNull(),
		externalId: bigint("external_id", {
			mode: "number",
		}).notNull(),
		prNumber: bigint("pr_number", {
			mode: "number",
		}).notNull(),
		status: prReviewStatusEnum("status").default("pending").notNull(),
		assignees: jsonb("assignees")
			.$type<
				{
					name: string;
					avatarUrl: string;
					userId?: string;
				}[]
			>()
			.default([]),
		assigneesUserIds: text("assignees_user_ids").array().default([]).notNull(),

		reviewers: jsonb("reviewers")
			.$type<
				{
					name: string;
					avatarUrl: string;
					userId?: string;
				}[]
			>()
			.default([]),
		reviewersUserIds: text("reviewers_user_ids").array().default([]).notNull(),
		title: text("title").notNull(),
		body: text("body").notNull(),
		state: text("state").notNull(),
		prUrl: text("pr_url").notNull(),
		draft: boolean("draft").default(false).notNull(),
		merged: boolean("merged").default(false).notNull(),
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
			name: "pull_request_reviews_team_id_fkey",
		}).onDelete("cascade"),
		foreignKey({
			columns: [table.connectedRepoId],
			foreignColumns: [githubRepositoryConnected.id],
			name: "pull_request_reviews_connected_repo_id_fkey",
		}).onDelete("cascade"),
		unique("unique_pr_review_per_team").on(table.externalId),
	],
);

export interface ZenModeSettings {
	focusGuard: {
		enabled: boolean;
		// options: short = 25 minutes, medium = 50 minutes, long = 90 minutes
		limit: "short" | "medium" | "long";
		// whether to require breaks between focus sessions
		requireBreaks: boolean;

		// advanced
		focusDurationMinutes?: number;
		minBreakDurationMinutes?: number;
		disableSkipBreaks?: boolean;
	};
}

export const zenModeSettings = pgTable(
	"zen_mode_settings",
	{
		id: text()
			.$defaultFn(() => randomUUID())
			.primaryKey()
			.notNull(),
		userId: text("user_id").notNull(),
		teamId: text("team_id").notNull(),

		lastZenModeAt: timestamp("last_zen_mode_at", {
			withTimezone: true,
		}),

		settings: jsonb("settings")
			.$type<ZenModeSettings>()
			.default({
				focusGuard: {
					enabled: false,
					limit: "short",
					requireBreaks: false,
				},
			}),

		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		unique("unique_zen_mode_settings_per_user_team").on(
			table.userId,
			table.teamId,
		),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "zen_mode_settings_user_id_fkey",
		}).onDelete("cascade"),
		foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "zen_mode_settings_team_id_fkey",
		}).onDelete("cascade"),
	],
);

export const inboxStatusEnum = pgEnum("inbox_status", ["pending", "archived"]);

export const inbox = pgTable(
	"inbox",
	{
		id: text("id")
			.$defaultFn(() => randomUUID())
			.primaryKey()
			.notNull(),
		userId: text("user_id").notNull(),
		teamId: text("team_id").notNull(),
		display: text("display").notNull(),
		subtitle: text("subtitle"),
		content: text("content"),

		seen: boolean("seen").default(false).notNull(),
		status: inboxStatusEnum("status").default("pending").notNull(),

		metadata: jsonb("metadata").$type<Record<string, any>>(),
		source: text("source").notNull(),
		sourceId: text("source_id").notNull(),

		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		})
			.defaultNow()
			.notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "inbox_user_id_fkey",
		}).onDelete("cascade"),
		foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "inbox_team_id_fkey",
		}).onDelete("cascade"),
	],
);

export const intakeStatusEnum = pgEnum("intake_status", [
	"pending",
	"accepted",
	"dismissed",
]);

export const intakes = pgTable(
	"intakes",
	{
		id: text("id")
			.$defaultFn(() => randomUUID())
			.primaryKey()
			.notNull(),
		teamId: text("team_id").notNull(),
		userId: text("user_id").notNull(),
		status: intakeStatusEnum("status").default("pending").notNull(),
		reasoning: text("reasoning"),

		assigneeId: text("assignee_id"),
		source: text("source").notNull(),
		sourceId: text("source_id").notNull(),
		payload: jsonb("payload").$type<CreateTaskInput>().notNull(),

		inboxId: text("inbox_id"),
		taskId: text("task_id"),

		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
		foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "intakes_team_id_fkey",
		}).onDelete("cascade"),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "intakes_user_id_fkey",
		}).onDelete("cascade"),
		foreignKey({
			columns: [table.assigneeId],
			foreignColumns: [users.id],
			name: "intakes_assignee_id_fkey",
		}).onDelete("set null"),
		foreignKey({
			columns: [table.inboxId],
			foreignColumns: [inbox.id],
			name: "intakes_inbox_id_fkey",
		}).onDelete("set null"),
		foreignKey({
			columns: [table.taskId],
			foreignColumns: [tasks.id],
			name: "intakes_task_id_fkey",
		}).onDelete("set null"),
	],
);

export const taskViews = pgTable(
	"task_views",
	{
		id: text("id")
			.$defaultFn(() => randomUUID())
			.primaryKey()
			.notNull(),
		name: text("name").notNull(),
		description: text("description"),
		teamId: text("team_id").notNull(),
		userId: text("user_id").notNull(),
		projectId: text("project_id"),
		viewType: text("view_type").notNull(), // e.g., 'list', 'board', 'calendar'
		filters: jsonb("filters").$type<Record<string, any>>().notNull(),
		isDefault: boolean("is_default").default(false).notNull(),
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
		index("task_views_team_id_index").using("btree", table.teamId),
		index("task_views_project_id_index").using("btree", table.projectId),
		foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "task_views_team_id_fkey",
		}).onDelete("cascade"),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "task_views_user_id_fkey",
		}).onDelete("cascade"),
		foreignKey({
			columns: [table.projectId],
			foreignColumns: [projects.id],
			name: "task_views_project_id_fkey",
		}).onDelete("cascade"),
	],
);

export const mcpTransportTypeEnum = pgEnum("mcp_transport_type", [
	"http",
	"sse",
]);

export interface McpServerConfig {
	url: string;
	headers?: Record<string, string>;
	scopes?: string[];
}

export const mcpServers = pgTable(
	"mcp_servers",
	{
		id: text("id")
			.$defaultFn(() => randomUUID())
			.primaryKey()
			.notNull(),
		teamId: text("team_id").notNull(),
		name: text("name").notNull(),
		description: text("description"),
		transport: mcpTransportTypeEnum("transport").default("http").notNull(),
		config: jsonb("config").$type<McpServerConfig>().notNull(),
		isActive: boolean("is_active").default(true).notNull(),
		createdBy: text("created_by").notNull(),
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
		index("mcp_servers_team_id_index").using("btree", table.teamId),
		unique("unique_mcp_server_name_per_team").on(table.name, table.teamId),
		foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "mcp_servers_team_id_fkey",
		}).onDelete("cascade"),
		foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "mcp_servers_created_by_fkey",
		}).onDelete("cascade"),
	],
);

/**
 * Persistent agent memory — long-term knowledge entries that agents
 * accumulate across task executions so they can specialise over time.
 *
 * Each row is a single "lesson learned" or annotation.  Entries are
 * scoped to a specific agent (via `agentId`) and team.
 */
export const agentMemories = pgTable(
	"agent_memories",
	{
		id: text("id")
			.$defaultFn(() => randomUUID())
			.primaryKey()
			.notNull(),

		/** The agent that owns this memory */
		agentId: text("agent_id").notNull(),
		teamId: text("team_id").notNull(),

		/**
		 * Category of the memory entry.
		 *
		 * - lesson: something the agent learned from a mistake or success
		 * - preference: a user / team preference the agent inferred
		 * - fact: a factual piece of knowledge relevant to the team's domain
		 * - procedure: a step-by-step procedure the agent discovered
		 */
		category: text("category", {
			enum: ["lesson", "preference", "fact", "procedure"],
		})
			.default("lesson")
			.notNull(),

		/** Short human-readable title / summary */
		title: text("title").notNull(),

		/** Detailed content / annotation */
		content: text("content").notNull(),

		/**
		 * Free-form tags that help the agent decide when a memory is relevant.
		 * E.g. ["email-drafting", "formatting", "project-alpha"]
		 */
		tags: text("tags").array().default([]).notNull(),

		/** Optional back-link to the task that originated this memory */
		sourceTaskId: text("source_task_id"),

		/**
		 * Relevance score — the agent can bump this when a memory proves useful
		 * or decay it over time.  Higher = more relevant.
		 */
		relevanceScore: integer("relevance_score").default(1).notNull(),

		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		})
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", {
			withTimezone: true,
			mode: "string",
		})
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index("agent_memories_agent_id_index").on(table.agentId),
		index("agent_memories_team_id_index").on(table.teamId),
		index("agent_memories_category_index").on(table.category),
		foreignKey({
			columns: [table.agentId],
			foreignColumns: [agents.id],
			name: "agent_memories_agent_id_fkey",
		}).onDelete("cascade"),
		foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "agent_memories_team_id_fkey",
		}).onDelete("cascade"),
		foreignKey({
			columns: [table.sourceTaskId],
			foreignColumns: [tasks.id],
			name: "agent_memories_source_task_id_fkey",
		}).onDelete("set null"),
	],
);

export const globalSearchView = buildGlobalSearchView();
