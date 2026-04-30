CREATE TYPE "public"."activity_source" AS ENUM('task', 'comment', 'checklist_item');--> statement-breakpoint
CREATE TYPE "public"."activity_status" AS ENUM('unread', 'read', 'archived');--> statement-breakpoint
CREATE TYPE "public"."activity_type" AS ENUM('task_column_changed', 'task_completed', 'task_created', 'task_updated', 'task_comment', 'task_comment_reply', 'task_assigned', 'task_execution_started', 'task_execution_completed', 'checklist_item_completed', 'checklist_item_created', 'checklist_item_updated', 'mention', 'resume_generated', 'daily_digest', 'daily_pulse', 'daily_end_of_day', 'daily_team_summary', 'follow_up');--> statement-breakpoint
CREATE TYPE "public"."credit_movement_type" AS ENUM('purchase', 'usage', 'refund', 'adjustment', 'promo');--> statement-breakpoint
CREATE TYPE "public"."task_import_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."import_type" AS ENUM('tasks_csv');--> statement-breakpoint
CREATE TYPE "public"."inbox_status" AS ENUM('pending', 'archived');--> statement-breakpoint
CREATE TYPE "public"."intake_status" AS ENUM('pending', 'accepted', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."integration_logs_level" AS ENUM('info', 'warning', 'error');--> statement-breakpoint
CREATE TYPE "public"."mcp_transport_type" AS ENUM('http', 'sse');--> statement-breakpoint
CREATE TYPE "public"."plans" AS ENUM('free', 'team');--> statement-breakpoint
CREATE TYPE "public"."pr_review_status" AS ENUM('pending', 'closed', 'approved', 'changes_requested', 'reviewed', 'review_requested');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."project_execution_status" AS ENUM('pending', 'executing', 'idle', 'blocked', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."project_health" AS ENUM('on_track', 'at_risk', 'off_track');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('planning', 'in_progress', 'completed', 'on_hold');--> statement-breakpoint
CREATE TYPE "public"."project_visibility" AS ENUM('team', 'private');--> statement-breakpoint
CREATE TYPE "public"."pull_request_plan_status" AS ENUM('pending', 'completed', 'canceled', 'error');--> statement-breakpoint
CREATE TYPE "public"."share_policy" AS ENUM('private', 'public');--> statement-breakpoint
CREATE TYPE "public"."shared_resource_type" AS ENUM('task', 'project');--> statement-breakpoint
CREATE TYPE "public"."status_type" AS ENUM('done', 'backlog', 'to_do', 'in_progress', 'review');--> statement-breakpoint
CREATE TYPE "public"."task_dependency_type" AS ENUM('blocks', 'relates_to');--> statement-breakpoint
CREATE TYPE "public"."task_execution_status" AS ENUM('pending', 'executing', 'blocked', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."suggestion_status" AS ENUM('pending', 'accepted', 'rejected');--> statement-breakpoint
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
	"reply_to_activity_id" text,
	"source" "activity_source",
	"type" "activity_type" NOT NULL,
	"metadata" jsonb,
	"status" "activity_status" DEFAULT 'unread' NOT NULL,
	"priority" smallint DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "activity_reactions" (
	"id" text PRIMARY KEY NOT NULL,
	"activity_id" text NOT NULL,
	"user_id" text NOT NULL,
	"reaction" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "unique_activity_user_reaction" UNIQUE("activity_id","user_id","reaction")
);
--> statement-breakpoint
CREATE TABLE "agent_memories" (
	"id" text PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"team_id" text NOT NULL,
	"category" text DEFAULT 'lesson' NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"source_task_id" text,
	"relevance_score" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agents" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"avatar" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"model" text DEFAULT 'anthropic/claude-haiku-4.5' NOT NULL,
	"soul" text,
	"user_id" text NOT NULL,
	"behalf_user_id" text,
	"authorize_integrations" boolean DEFAULT false NOT NULL,
	"active_toolboxes" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "apikey" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"start" text,
	"prefix" text,
	"key" text NOT NULL,
	"user_id" text NOT NULL,
	"team_id" text,
	"refill_interval" integer,
	"refill_amount" integer,
	"last_refill_at" timestamp,
	"enabled" boolean DEFAULT true NOT NULL,
	"rate_limit_enabled" boolean DEFAULT true NOT NULL,
	"rate_limit_time_window" integer,
	"rate_limit_max" integer,
	"request_count" integer DEFAULT 0 NOT NULL,
	"remaining" integer,
	"last_request" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"permissions" text,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "autopilot_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"allowed_weekdays" integer[] DEFAULT '{1,2,3,4,5}',
	"enable_follow_ups" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_autopilot_settings_per_team" UNIQUE("team_id")
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
	"summary" text,
	"active_stream_id" text,
	"last_summary_at" timestamp with time zone,
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
CREATE TABLE "credit_balance" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"balance_cents" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_credit_balance_per_team" UNIQUE("team_id")
);
--> statement-breakpoint
CREATE TABLE "credit_ledger" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"type" "credit_movement_type" NOT NULL,
	"amount_cents" integer NOT NULL,
	"stripe_payment_intent_id" text,
	"stripe_event_id" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "credit_ledger_stripe_event_id_unique" UNIQUE("stripe_event_id")
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"icon" text,
	"content" text,
	"team_id" text NOT NULL,
	"parent_id" text,
	"order" integer DEFAULT 0 NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text,
	"fts" "tsvector" GENERATED ALWAYS AS (to_tsvector('english', coalesce("name",'') || ' ' || coalesce("content",''))) STORED,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents_on_agents" (
	"agent_id" text NOT NULL,
	"document_id" text NOT NULL,
	CONSTRAINT "documents_on_agents_pkey" PRIMARY KEY("agent_id","document_id")
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
	"connected_by_user_id" text NOT NULL,
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
CREATE TABLE "inbox" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"team_id" text NOT NULL,
	"display" text NOT NULL,
	"subtitle" text,
	"content" text,
	"seen" boolean DEFAULT false NOT NULL,
	"status" "inbox_status" DEFAULT 'pending' NOT NULL,
	"metadata" jsonb,
	"source" text NOT NULL,
	"source_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intakes" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"user_id" text NOT NULL,
	"status" "intake_status" DEFAULT 'pending' NOT NULL,
	"reasoning" text,
	"assignee_id" text,
	"source" text NOT NULL,
	"source_id" text NOT NULL,
	"payload" jsonb NOT NULL,
	"inbox_id" text,
	"task_id" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "integration_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"integration_id" text NOT NULL,
	"level" "integration_logs_level" NOT NULL,
	"message" text NOT NULL,
	"integration_user_link_id" text,
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
	"mcp_server_id" text,
	"integration_type" text,
	"access_token" text,
	"refresh_token" text,
	"config" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "unique_integration_user" UNIQUE("integration_id","user_id","external_user_id"),
	CONSTRAINT "unique_mcp_server_user" UNIQUE("mcp_server_id","user_id","external_user_id")
);
--> statement-breakpoint
CREATE TABLE "integrations" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
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
CREATE TABLE "labels_on_documents" (
	"label_id" text NOT NULL,
	"document_id" text NOT NULL,
	CONSTRAINT "labels_on_documents_pkey" PRIMARY KEY("label_id","document_id")
);
--> statement-breakpoint
CREATE TABLE "labels_on_tasks" (
	"label_id" text NOT NULL,
	"task_id" text NOT NULL,
	CONSTRAINT "labels_on_tasks_pkey" PRIMARY KEY("label_id","task_id")
);
--> statement-breakpoint
CREATE TABLE "mcp_servers" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"transport" "mcp_transport_type" DEFAULT 'http' NOT NULL,
	"config" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "unique_mcp_server_name_per_team" UNIQUE("name","team_id")
);
--> statement-breakpoint
CREATE TABLE "milestones" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"due_date" timestamp with time zone,
	"color" text,
	"team_id" text NOT NULL,
	"project_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "unique_milestone_name_per_project" UNIQUE("name","project_id")
);
--> statement-breakpoint
CREATE TABLE "newsletter" (
	"email" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
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
CREATE TABLE "pr_reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"connected_repo_id" text NOT NULL,
	"external_id" bigint NOT NULL,
	"pr_number" bigint NOT NULL,
	"status" "pr_review_status" DEFAULT 'pending' NOT NULL,
	"assignees" jsonb DEFAULT '[]'::jsonb,
	"assignees_user_ids" text[] DEFAULT '{}' NOT NULL,
	"reviewers" jsonb DEFAULT '[]'::jsonb,
	"reviewers_user_ids" text[] DEFAULT '{}' NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"state" text NOT NULL,
	"pr_url" text NOT NULL,
	"draft" boolean DEFAULT false NOT NULL,
	"merged" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_pr_review_per_team" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "project_executions" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"team_id" text NOT NULL,
	"status" "project_execution_status" DEFAULT 'pending' NOT NULL,
	"usage_metrics" jsonb,
	"memory" jsonb DEFAULT '{}'::jsonb,
	"context_stale" boolean DEFAULT false NOT NULL,
	"trigger_job_id" text,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "unique_active_project_execution" UNIQUE("project_id")
);
--> statement-breakpoint
CREATE TABLE "project_health_updates" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"team_id" text NOT NULL,
	"health" "project_health" NOT NULL,
	"summary" text,
	"snapshot" jsonb NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "project_members" (
	"project_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "project_members_pkey" PRIMARY KEY("project_id","user_id")
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
	"lead_id" text,
	"visibility" "project_visibility" DEFAULT 'team' NOT NULL,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"status" "project_status" DEFAULT 'planning' NOT NULL,
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
	"status_id" text NOT NULL,
	"comment_id" bigint,
	"url" text,
	"title" text,
	"head_commit_sha" text NOT NULL,
	"status" "pull_request_plan_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
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
	"metadata" jsonb,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "shared_resources" (
	"id" text PRIMARY KEY NOT NULL,
	"resource_type" "shared_resource_type" NOT NULL,
	"resource_id" text NOT NULL,
	"team_id" text NOT NULL,
	"policy" "share_policy" DEFAULT 'private' NOT NULL,
	"authorized_emails" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "unique_shared_resource_per_team" UNIQUE("resource_type","resource_id","team_id"),
	CONSTRAINT "unique_shared_resource_id" UNIQUE("resource_id")
);
--> statement-breakpoint
CREATE TABLE "statuses" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"team_id" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"description" text,
	"type" "status_type" DEFAULT 'in_progress' NOT NULL,
	"is_final_state" boolean DEFAULT false NOT NULL,
	"project_ids" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "unique_status_name_per_team" UNIQUE("name","team_id")
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
CREATE TABLE "task_executions" (
	"id" text PRIMARY KEY NOT NULL,
	"task_id" text NOT NULL,
	"team_id" text NOT NULL,
	"status" "task_execution_status" DEFAULT 'pending' NOT NULL,
	"usage_metrics" jsonb,
	"memory" jsonb DEFAULT '{}'::jsonb,
	"context_stale" boolean DEFAULT false NOT NULL,
	"content_hash" text,
	"trigger_job_id" text,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "unique_active_task_execution" UNIQUE("task_id")
);
--> statement-breakpoint
CREATE TABLE "task_suggestions" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"content" text NOT NULL,
	"status" "suggestion_status" DEFAULT 'pending' NOT NULL,
	"task_id" text NOT NULL,
	"payload" jsonb NOT NULL,
	"key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "task_views" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"team_id" text NOT NULL,
	"user_id" text NOT NULL,
	"project_id" text,
	"view_type" text NOT NULL,
	"filters" jsonb NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
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
	"created_by" text,
	"team_id" text NOT NULL,
	"order" numeric(100, 5) NOT NULL,
	"status_id" text NOT NULL,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"score" integer DEFAULT 1 NOT NULL,
	"repository_name" text,
	"branch_name" text,
	"fts" "tsvector" GENERATED ALWAYS AS (to_tsvector('english', coalesce("title",'') || ' ' || coalesce("description",''))) STORED,
	"due_date" timestamp with time zone,
	"subscribers" text[] DEFAULT '{}' NOT NULL,
	"mentions" text[] DEFAULT '{}' NOT NULL,
	"project_id" text,
	"milestone_id" text,
	"pr_review_id" text,
	"focus_order" smallint,
	"focus_reason" text,
	"recurring" text,
	"recurring_job_id" text,
	"recurring_next_date" timestamp with time zone,
	"trigger_id" text,
	"is_template" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone,
	"completed_by" text,
	"status_changed_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "tasks_permalink_id_unique" UNIQUE("permalink_id")
);
--> statement-breakpoint
CREATE TABLE "tasks_dependencies" (
	"task_id" text NOT NULL,
	"depends_on_task_id" text NOT NULL,
	"type" "task_dependency_type" DEFAULT 'relates_to' NOT NULL,
	"explanation" text,
	CONSTRAINT "tasks_dependencies_pkey" PRIMARY KEY("task_id","depends_on_task_id")
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"prefix" text NOT NULL,
	"description" text,
	"email" text NOT NULL,
	"plan" "plans",
	"subscription_id" text,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"locale" text DEFAULT 'en-US' NOT NULL,
	"customer_id" text,
	"canceled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "teams_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "triggers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"team_id" text NOT NULL,
	"integration_id" text,
	"type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
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
	"team_slug" text,
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
CREATE TABLE "working_memory" (
	"id" text PRIMARY KEY NOT NULL,
	"chat_id" text NOT NULL,
	"user_id" text NOT NULL,
	"content" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zen_mode_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"team_id" text NOT NULL,
	"last_zen_mode_at" timestamp with time zone,
	"settings" jsonb DEFAULT '{"focusGuard":{"enabled":false,"limit":"short","requireBreaks":false}}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_zen_mode_settings_per_user_team" UNIQUE("user_id","team_id")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activity_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activity_log_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_reactions" ADD CONSTRAINT "activity_reactions_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_reactions" ADD CONSTRAINT "activity_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_memories" ADD CONSTRAINT "agent_memories_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_memories" ADD CONSTRAINT "agent_memories_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_memories" ADD CONSTRAINT "agent_memories_source_task_id_fkey" FOREIGN KEY ("source_task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apikey" ADD CONSTRAINT "apikey_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apikey" ADD CONSTRAINT "apikey_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "autopilot_settings" ADD CONSTRAINT "autopilot_settings_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_balance" ADD CONSTRAINT "credit_balance_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_ledger" ADD CONSTRAINT "credit_ledger_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents_on_agents" ADD CONSTRAINT "documents_on_agents_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents_on_agents" ADD CONSTRAINT "documents_on_agents_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github_repository_connected" ADD CONSTRAINT "github_repository_connected_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github_repository_connected" ADD CONSTRAINT "github_repository_connected_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "public"."integrations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "github_repository_connected" ADD CONSTRAINT "github_repository_connected_connected_by_user_id_fkey" FOREIGN KEY ("connected_by_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbox" ADD CONSTRAINT "inbox_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbox" ADD CONSTRAINT "inbox_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intakes" ADD CONSTRAINT "intakes_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intakes" ADD CONSTRAINT "intakes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intakes" ADD CONSTRAINT "intakes_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intakes" ADD CONSTRAINT "intakes_inbox_id_fkey" FOREIGN KEY ("inbox_id") REFERENCES "public"."inbox"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intakes" ADD CONSTRAINT "intakes_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_logs" ADD CONSTRAINT "integration_logs_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "public"."integrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_logs" ADD CONSTRAINT "integration_logs_integration_user_link_id_fkey" FOREIGN KEY ("integration_user_link_id") REFERENCES "public"."integration_user_link"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_user_link" ADD CONSTRAINT "integration_user_link_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_user_link" ADD CONSTRAINT "integration_user_link_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "public"."integrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_user_link" ADD CONSTRAINT "integration_user_link_mcp_server_id_fkey" FOREIGN KEY ("mcp_server_id") REFERENCES "public"."mcp_servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "labels" ADD CONSTRAINT "labels_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "labels_on_documents" ADD CONSTRAINT "labels_on_documents_label_id_fkey" FOREIGN KEY ("label_id") REFERENCES "public"."labels"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "labels_on_documents" ADD CONSTRAINT "labels_on_documents_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "labels_on_tasks" ADD CONSTRAINT "labels_on_tasks_label_id_fkey" FOREIGN KEY ("label_id") REFERENCES "public"."labels"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "labels_on_tasks" ADD CONSTRAINT "labels_on_tasks_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "mcp_servers" ADD CONSTRAINT "mcp_servers_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_servers" ADD CONSTRAINT "mcp_servers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pr_reviews" ADD CONSTRAINT "pull_request_reviews_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pr_reviews" ADD CONSTRAINT "pull_request_reviews_connected_repo_id_fkey" FOREIGN KEY ("connected_repo_id") REFERENCES "public"."github_repository_connected"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_executions" ADD CONSTRAINT "project_executions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_executions" ADD CONSTRAINT "project_executions_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_health_updates" ADD CONSTRAINT "project_health_updates_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_health_updates" ADD CONSTRAINT "project_health_updates_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_health_updates" ADD CONSTRAINT "project_health_updates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_resources" ADD CONSTRAINT "shared_resources_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "statuses" ADD CONSTRAINT "statuses_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_embeddings" ADD CONSTRAINT "task_embeddings_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_embeddings" ADD CONSTRAINT "task_embeddings_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_executions" ADD CONSTRAINT "task_executions_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_executions" ADD CONSTRAINT "task_executions_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_suggestions" ADD CONSTRAINT "task_suggestions_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_suggestions" ADD CONSTRAINT "task_suggestions_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_views" ADD CONSTRAINT "task_views_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_views" ADD CONSTRAINT "task_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_views" ADD CONSTRAINT "task_views_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_column_id_fkey" FOREIGN KEY ("status_id") REFERENCES "public"."statuses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "public"."milestones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_pr_review_id_fkey" FOREIGN KEY ("pr_review_id") REFERENCES "public"."pr_reviews"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_trigger_id_fkey" FOREIGN KEY ("trigger_id") REFERENCES "public"."triggers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks_dependencies" ADD CONSTRAINT "tasks_dependencies_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks_dependencies" ADD CONSTRAINT "tasks_dependencies_depends_on_task_id_fkey" FOREIGN KEY ("depends_on_task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "triggers" ADD CONSTRAINT "triggers_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "triggers" ADD CONSTRAINT "triggers_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "public"."integrations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_invites" ADD CONSTRAINT "user_invites_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_invites" ADD CONSTRAINT "user_invites_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_on_teams" ADD CONSTRAINT "users_on_teams_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "users_on_teams" ADD CONSTRAINT "users_on_teams_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "zen_mode_settings" ADD CONSTRAINT "zen_mode_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zen_mode_settings" ADD CONSTRAINT "zen_mode_settings_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_group_id_index" ON "activities" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "activity_type_index" ON "activities" USING btree ("type");--> statement-breakpoint
CREATE INDEX "activity_inbox_index" ON "activities" USING btree ("priority","status","user_id");--> statement-breakpoint
CREATE INDEX "activity_team_id_index" ON "activities" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "activity_created_at_index" ON "activities" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "activity_reactions_activity_id_index" ON "activity_reactions" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "activity_reactions_user_id_index" ON "activity_reactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "agent_memories_agent_id_index" ON "agent_memories" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "agent_memories_team_id_index" ON "agent_memories" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "agent_memories_category_index" ON "agent_memories" USING btree ("category");--> statement-breakpoint
CREATE INDEX "agents_team_id_index" ON "agents" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "chat_messages_chat_id_index" ON "chat_messages" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "chat_messages_user_id_index" ON "chat_messages" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "chats_team_id_index" ON "chats" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "chats_user_id_index" ON "chats" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "checklist_items_task_id_index" ON "checklist_items" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "checklist_items_team_id_index" ON "checklist_items" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "credit_balance_team_id_index" ON "credit_balance" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "credit_ledger_team_id_index" ON "credit_ledger" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "credit_ledger_type_index" ON "credit_ledger" USING btree ("type");--> statement-breakpoint
CREATE INDEX "credit_ledger_stripe_payment_intent_id_index" ON "credit_ledger" USING btree ("stripe_payment_intent_id");--> statement-breakpoint
CREATE INDEX "credit_ledger_created_at_index" ON "credit_ledger" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "documents_team_id_index" ON "documents" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "documents_parent_id_index" ON "documents" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "documents_fts" ON "documents" USING gin ("fts" tsvector_ops);--> statement-breakpoint
CREATE INDEX "documents_on_agents_agent_id_index" ON "documents_on_agents" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "documents_on_agents_document_id_index" ON "documents_on_agents" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "labels_name_team_id_index" ON "labels" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "labels_on_documents_document_id_index" ON "labels_on_documents" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "labels_on_tasks_task_id_index" ON "labels_on_tasks" USING btree ("label_id");--> statement-breakpoint
CREATE INDEX "mcp_servers_team_id_index" ON "mcp_servers" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "notification_settings_user_team_idx" ON "notification_settings" USING btree ("user_id","team_id");--> statement-breakpoint
CREATE INDEX "notification_settings_type_channel_idx" ON "notification_settings" USING btree ("notification_type","channel");--> statement-breakpoint
CREATE INDEX "project_executions_project_id_index" ON "project_executions" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_executions_team_id_index" ON "project_executions" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "project_executions_status_index" ON "project_executions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "project_health_updates_team_id_index" ON "project_health_updates" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "projects_team_id_index" ON "projects" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "shared_resources_team_id_index" ON "shared_resources" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "shared_resources_resource_index" ON "shared_resources" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "document_tag_embeddings_idx" ON "task_embeddings" USING hnsw ("embedding" vector_cosine_ops) WITH (m=16,ef_construction=64);--> statement-breakpoint
CREATE INDEX "task_executions_task_id_index" ON "task_executions" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "task_executions_team_id_index" ON "task_executions" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "task_executions_status_index" ON "task_executions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "task_suggestions_team_id_index" ON "task_suggestions" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "task_suggestions_created_at_index" ON "task_suggestions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "task_views_team_id_index" ON "task_views" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "task_views_project_id_index" ON "task_views" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "tasks_fts" ON "tasks" USING gin ("fts" tsvector_ops);--> statement-breakpoint
CREATE INDEX "tasks_order_index" ON "tasks" USING btree ("order");--> statement-breakpoint
CREATE INDEX "tasks_sequence_index" ON "tasks" USING btree ("sequence");--> statement-breakpoint
CREATE INDEX "tasks_permalink_id_index" ON "tasks" USING btree ("permalink_id");--> statement-breakpoint
CREATE INDEX "tasks_team_id_index" ON "tasks" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "tasks_assignee_id_index" ON "tasks" USING btree ("assignee_id");--> statement-breakpoint
CREATE INDEX "tasks_is_template_index" ON "tasks" USING btree ("is_template");--> statement-breakpoint
CREATE INDEX "tasks_trigger_id_index" ON "tasks" USING btree ("trigger_id");--> statement-breakpoint
CREATE INDEX "tasks_dependencies_task_id_index" ON "tasks_dependencies" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "triggers_team_id_index" ON "triggers" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "triggers_integration_id_index" ON "triggers" USING btree ("integration_id");--> statement-breakpoint
CREATE INDEX "triggers_type_index" ON "triggers" USING btree ("type");--> statement-breakpoint
CREATE INDEX "user_invites_team_id_index" ON "user_invites" USING btree ("team_id");--> statement-breakpoint
CREATE VIEW "public"."global_search_view_v6" AS (((select "id", 'task' as "type", "title", NULL as "color", NULL as "parent_id", "team_id" from "tasks") union all (select "id", 'project' as "type", "name", "color", NULL as "parent_id", "team_id" from "projects")) union all (select "id", 'milestone' as "type", "name", "color", "project_id", "team_id" from "milestones"));