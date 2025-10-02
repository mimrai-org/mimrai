import { randomUUID } from "crypto";
import { relations } from "drizzle-orm";
import {
	boolean,
	foreignKey,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
} from "drizzle-orm/pg-core";
import type { UIChatMessage } from "@/ai/types";
import type {
	IntegrationConfig,
	IntegrationName,
} from "@/lib/integrations/registry";

export const teams = pgTable("teams", {
	id: text("id")
		.$defaultFn(() => randomUUID())
		.primaryKey(),
	name: text("name").notNull(),
	description: text("description"),
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
	],
);

export const usersOnTeams = pgTable(
	"users_on_teams",
	{
		userId: text("user_id").notNull(),
		teamId: text("team_id").notNull(),
		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "string",
		}).defaultNow(),
	},
	(table) => [
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

export const priorityEnum = pgEnum("task_priority", ["low", "medium", "high"]);

export const tasks = pgTable(
	"tasks",
	{
		id: text("id")
			.$defaultFn(() => randomUUID())
			.primaryKey()
			.notNull(),
		title: text("title").notNull(),
		description: text("description"),
		priority: priorityEnum("priority").default("medium").notNull(),
		assigneeId: text("assignee_id"),
		teamId: text("team_id").notNull(),
		order: integer("order").default(0).notNull(),
		columnId: text("column_id").notNull(),
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
	},
	(table) => [
		foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "columns_team_id_fkey",
		}),
	],
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

export const integrationLogs = pgTable("integration_logs", {
	id: text("id")
		.$defaultFn(() => randomUUID())
		.primaryKey()
		.notNull(),
	integrationId: text("integration_id").notNull(),
	level: text("level").notNull(),
	message: text("message").notNull(),
	details: jsonb("details"),
	createdAt: timestamp("created_at", {
		withTimezone: true,
		mode: "string",
	}).defaultNow(),
});

export const mattermostUser = pgTable(
	"mattermost_users",
	{
		id: text("id")
			.$defaultFn(() => randomUUID())
			.primaryKey()
			.notNull(),
		userId: text("user_id").notNull(),
		mattermostUserId: text("mattermost_user_id").notNull(),
		integrationId: text("integration_id").notNull(),
	},
	(table) => [
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "mattermost_users_user_id_fkey",
		}),
	],
);
