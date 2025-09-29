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
	uuid,
} from "drizzle-orm/pg-core";
import type { UIChatMessage } from "@/ai/types";

export const teams = pgTable("teams", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
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
		teamId: text("team_id").notNull(),
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
		id: uuid("id").defaultRandom().primaryKey().notNull(),
		title: text("title").notNull(),
		description: text("description"),
		priority: priorityEnum("priority").default("medium").notNull(),
		assigneeId: text("assignee_id"),
		teamId: text("team_id").notNull(),
		order: integer("order").default(0).notNull(),
		columnId: uuid("column_id").notNull(),
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
		id: uuid("id").defaultRandom().primaryKey().notNull(),
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
		id: uuid("id").defaultRandom().primaryKey().notNull(),
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
		id: uuid("id").defaultRandom().primaryKey().notNull(),
		chatId: uuid("chat_id").notNull(),
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
