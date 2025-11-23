CREATE TYPE "public"."activity_source" AS ENUM('task', 'comment', 'checklist_item');--> statement-breakpoint
CREATE TYPE "public"."activity_type" AS ENUM('task_column_changed', 'task_completed', 'task_created', 'task_updated', 'task_comment', 'task_assigned', 'checklist_item_completed', 'checklist_item_created', 'checklist_item_updated', 'mention', 'resume_generated', 'daily_digest', 'daily_pulse', 'daily_end_of_day');--> statement-breakpoint
CREATE TYPE "public"."column_type" AS ENUM('done', 'backlog', 'to_do', 'in_progress', 'review');--> statement-breakpoint
CREATE TYPE "public"."task_import_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."import_type" AS ENUM('tasks_csv');--> statement-breakpoint
CREATE TYPE "public"."intake_source" AS ENUM('gmail', 'voice', 'manual');--> statement-breakpoint
CREATE TYPE "public"."intake_status" AS ENUM('pending', 'accepted', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."plans" AS ENUM('starter');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."pull_request_plan_status" AS ENUM('pending', 'completed', 'canceled', 'error');--> statement-breakpoint
CREATE TYPE "public"."team_role" AS ENUM('owner', 'member');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activities" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"team_id" text NOT NULL,
	"group_id" text,
	"source" "activity_source",
	"type" "activity_type" NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"chat_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text,
	"content" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chats" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text,
	"user_id" text NOT NULL,
	"title" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "checklist_items" (
	"id" text PRIMARY KEY NOT NULL,
	"task_id" text,
	"description" text NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"order" numeric(100, 5) DEFAULT 0 NOT NULL,
	"assignee_id" text,
	"team_id" text NOT NULL,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "columns" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"team_id" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"description" text,
	"type" "column_type" DEFAULT 'in_progress' NOT NULL,
	"is_final_state" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "unique_column_name_per_team" UNIQUE("name","team_id")
);
--> statement-breakpoint
CREATE TABLE "github_repository_connected" (
	"id" text PRIMARY KEY NOT NULL,
	"installation_id" integer NOT NULL,
	"team_id" text NOT NULL,
	"repository_id" integer NOT NULL,
	"repository_name" text NOT NULL,
	"integration_id" text NOT NULL,
	"branches" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "unique_github_repo_per_team" UNIQUE("team_id","repository_id")
);
--> statement-breakpoint
CREATE TABLE "imports" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"user_id" text NOT NULL,
	"file_name" text NOT NULL,
	"file_url" text,
	"file_path" text NOT NULL,
	"error" jsonb,
	"type" "import_type" NOT NULL,
	"status" "task_import_status" DEFAULT 'pending' NOT NULL,
	"job_id" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "intake" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"user_id" text,
	"source" "intake_source" NOT NULL,
	"content" text NOT NULL,
	"status" "intake_status" DEFAULT 'pending' NOT NULL,
	"ai_analysis" jsonb,
	"metadata" jsonb,
	"source_message_id" text,
	"task_id" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "unique_intake_source_per_team" UNIQUE("team_id","source_message_id")
);
--> statement-breakpoint
CREATE TABLE "integration_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"integration_id" text NOT NULL,
	"level" text NOT NULL,
	"message" text NOT NULL,
	"details" jsonb,
	"input_tokens" integer,
	"output_tokens" integer,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "integration_user_link" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"external_user_id" text NOT NULL,
	"external_user_name" text,
	"integration_id" text,
	"integration_type" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "unique_integration_user" UNIQUE("integration_id","user_id","external_user_id")
);
--> statement-breakpoint
CREATE TABLE "integrations" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"user_id" text,
	"external_team_id" text,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"config" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "labels" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text NOT NULL,
	"team_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "labels_on_tasks" (
	"label_id" text NOT NULL,
	"task_id" text NOT NULL,
	CONSTRAINT "labels_on_tasks_pkey" PRIMARY KEY("label_id","task_id")
);
--> statement-breakpoint
CREATE TABLE "notification_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"team_id" text NOT NULL,
	"notification_type" text NOT NULL,
	"channel" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_settings_user_team_type_channel_key" UNIQUE("user_id","team_id","notification_type","channel")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text,
	"archived" boolean DEFAULT false NOT NULL,
	"team_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "unique_project_name_per_team" UNIQUE("name","team_id")
);
--> statement-breakpoint
CREATE TABLE "pull_request_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"pr_number" bigint NOT NULL,
	"repo_id" bigint NOT NULL,
	"task_id" text NOT NULL,
	"column_id" text NOT NULL,
	"comment_id" bigint,
	"url" text,
	"title" text,
	"head_commit_sha" text NOT NULL,
	"status" "pull_request_plan_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "resume_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"cron_prompt" text DEFAULT '' NOT NULL,
	"cron_expression" text DEFAULT '0 0 * * *' NOT NULL,
	"instructions" text DEFAULT '' NOT NULL,
	"job_id" text,
	"should_update_job" boolean DEFAULT false NOT NULL,
	"next_run_at" timestamp with time zone,
	"last_run_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_resume_settings_per_team" UNIQUE("team_id")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "task_embeddings" (
	"id" text PRIMARY KEY NOT NULL,
	"task_id" text NOT NULL,
	"team_id" text NOT NULL,
	"embedding" vector(768) NOT NULL,
	"model" text DEFAULT 'google/gemini-embedding-001' NOT NULL,
	CONSTRAINT "unique_task_embedding_per_team" UNIQUE("task_id","team_id")
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"permalink_id" text NOT NULL,
	"title" text NOT NULL,
	"sequence" integer,
	"description" text,
	"priority" "task_priority" DEFAULT 'medium' NOT NULL,
	"assignee_id" text,
	"team_id" text NOT NULL,
	"order" numeric(100, 5) NOT NULL,
	"column_id" text NOT NULL,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"score" integer DEFAULT 1 NOT NULL,
	"repository_name" text,
	"branch_name" text,
	"fts" "tsvector" GENERATED ALWAYS AS (to_tsvector('english', coalesce("title",'') || ' ' || coalesce("description",''))) STORED,
	"due_date" timestamp with time zone,
	"subscribers" text[] DEFAULT '{}' NOT NULL,
	"mentions" text[] DEFAULT '{}' NOT NULL,
	"project_id" text,
	"recurring" jsonb,
	"recurring_job_id" text,
	"recurring_next_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "tasks_permalink_id_unique" UNIQUE("permalink_id")
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"email" text NOT NULL,
	"plan" "plans",
	"subscription_id" text,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"locale" text DEFAULT 'en-US' NOT NULL,
	"customer_id" text,
	"canceled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_invites" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"team_id" text NOT NULL,
	"code" text DEFAULT 'nanoid(24)',
	"invited_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "unique_team_invite" UNIQUE("email","team_id")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"locale" text,
	"team_id" text,
	"is_mentionable" boolean DEFAULT true NOT NULL,
	"color" text,
	"is_system_user" boolean DEFAULT false NOT NULL,
	"date_format" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "users_on_teams" (
	"user_id" text NOT NULL,
	"team_id" text NOT NULL,
	"role" "team_role" DEFAULT 'member' NOT NULL,
	"description" text DEFAULT '',
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_on_teams_pkey" PRIMARY KEY("user_id","team_id")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "waitlist" (
	"email" text PRIMARY KEY NOT NULL,
	"authorized" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "working_memory" (
	"id" text PRIMARY KEY NOT NULL,
	"chat_id" text NOT NULL,
	"user_id" text NOT NULL,
	"content" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activity_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activity_log_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "columns" ADD CONSTRAINT "columns_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github_repository_connected" ADD CONSTRAINT "github_repository_connected_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github_repository_connected" ADD CONSTRAINT "github_repository_connected_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "public"."integrations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "intake" ADD CONSTRAINT "intake_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intake" ADD CONSTRAINT "intake_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intake" ADD CONSTRAINT "intake_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_user_link" ADD CONSTRAINT "integration_user_link_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "labels" ADD CONSTRAINT "labels_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "labels_on_tasks" ADD CONSTRAINT "labels_on_tasks_label_id_fkey" FOREIGN KEY ("label_id") REFERENCES "public"."labels"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "labels_on_tasks" ADD CONSTRAINT "labels_on_tasks_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resume_settings" ADD CONSTRAINT "resume_settings_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_embeddings" ADD CONSTRAINT "task_embeddings_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_embeddings" ADD CONSTRAINT "task_embeddings_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_column_id_fkey" FOREIGN KEY ("column_id") REFERENCES "public"."columns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_invites" ADD CONSTRAINT "user_invites_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_invites" ADD CONSTRAINT "user_invites_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_on_teams" ADD CONSTRAINT "users_on_teams_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "users_on_teams" ADD CONSTRAINT "users_on_teams_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "activity_group_id_index" ON "activities" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "activity_type_index" ON "activities" USING btree ("type");--> statement-breakpoint
CREATE INDEX "chat_messages_chat_id_index" ON "chat_messages" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "chat_messages_user_id_index" ON "chat_messages" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "chats_team_id_index" ON "chats" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "chats_user_id_index" ON "chats" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "intake_team_id_index" ON "intake" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "intake_user_id_index" ON "intake" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "intake_source_message_id_index" ON "intake" USING btree ("source_message_id");--> statement-breakpoint
CREATE INDEX "notification_settings_user_team_idx" ON "notification_settings" USING btree ("user_id","team_id");--> statement-breakpoint
CREATE INDEX "notification_settings_type_channel_idx" ON "notification_settings" USING btree ("notification_type","channel");--> statement-breakpoint
CREATE INDEX "document_tag_embeddings_idx" ON "task_embeddings" USING hnsw ("embedding" vector_cosine_ops) WITH (m=16,ef_construction=64);--> statement-breakpoint
CREATE INDEX "tasks_fts" ON "tasks" USING gin ("fts" tsvector_ops);--> statement-breakpoint
CREATE INDEX "tasks_order_index" ON "tasks" USING btree ("order");--> statement-breakpoint
CREATE INDEX "tasks_sequence_index" ON "tasks" USING btree ("sequence");--> statement-breakpoint
CREATE INDEX "tasks_permalink_id_index" ON "tasks" USING btree ("permalink_id");--> statement-breakpoint
CREATE INDEX "user_invites_team_id_index" ON "user_invites" USING btree ("team_id");