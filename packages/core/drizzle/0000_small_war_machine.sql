CREATE TYPE "public"."alert_channel" AS ENUM('email', 'telegram', 'in_app');--> statement-breakpoint
CREATE TYPE "public"."alert_feedback" AS ENUM('up', 'down');--> statement-breakpoint
CREATE TYPE "public"."feedback_kind" AS ENUM('nps', 'alert', 'assistant', 'cancel', 'feature');--> statement-breakpoint
CREATE TYPE "public"."newsletter_status" AS ENUM('drafted', 'approved', 'sent', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."passport_status" AS ENUM('draft', 'complete');--> statement-breakpoint
CREATE TYPE "public"."plan" AS ENUM('harbor', 'voyage', 'fleet', 'lighthouse');--> statement-breakpoint
CREATE TYPE "public"."requirement_status" AS ENUM('todo', 'done', 'unsure', 'na');--> statement-breakpoint
CREATE TYPE "public"."severity" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."source_status" AS ENUM('ok', 'degraded', 'down', 'paused');--> statement-breakpoint
CREATE TYPE "public"."ticket_status" AS ENUM('open', 'ai_drafted', 'auto_resolved', 'resolved', 'escalated');--> statement-breakpoint
CREATE TYPE "public"."workspace_type" AS ENUM('seller', 'partner_client');--> statement-breakpoint
CREATE TABLE "admin_audit" (
	"id" text PRIMARY KEY NOT NULL,
	"actor" text NOT NULL,
	"action" text NOT NULL,
	"target" text,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "affiliates" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"code" text NOT NULL,
	"rate" real DEFAULT 0.25 NOT NULL,
	"earnings" numeric DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "affiliates_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"user_id" text NOT NULL,
	"product_id" text NOT NULL,
	"channel" "alert_channel" NOT NULL,
	"sent_at" timestamp with time zone,
	"opened_at" timestamp with time zone,
	"feedback" "alert_feedback",
	"feedback_note" text
);
--> statement-breakpoint
CREATE TABLE "assistant_threads" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"messages" jsonb NOT NULL,
	"escalated" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "badges" (
	"user_id" text NOT NULL,
	"key" text NOT NULL,
	"earned_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "badges_user_id_key_pk" PRIMARY KEY("user_id","key")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"source_doc_id" text,
	"affected_hts" text[],
	"affected_categories" text[],
	"summary" text NOT NULL,
	"dollar_impact_formula" text,
	"effective_date" timestamp with time zone,
	"confidence" real NOT NULL,
	"reviewed_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"kind" "feedback_kind" NOT NULL,
	"score" integer,
	"text" text,
	"context" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_issues" (
	"id" text PRIMARY KEY NOT NULL,
	"week_of" timestamp with time zone NOT NULL,
	"draft_md" text,
	"html" text,
	"status" "newsletter_status" DEFAULT 'drafted' NOT NULL,
	"approved_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"stats" jsonb
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscribers" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"source" text,
	"confirm_token" text,
	"confirmed_at" timestamp with time zone,
	"unsubscribed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "newsletter_subscribers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "product_requirements" (
	"product_id" text NOT NULL,
	"requirement_id" text NOT NULL,
	"status" "requirement_status" DEFAULT 'todo' NOT NULL,
	CONSTRAINT "product_requirements_product_id_requirement_id_pk" PRIMARY KEY("product_id","requirement_id")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"listing_url" text,
	"image_url" text,
	"materials" jsonb,
	"audience" text,
	"has_battery" boolean,
	"has_plug" boolean,
	"origin_country" text,
	"annual_import_value" integer,
	"hts_code" text,
	"hts_confidence" real,
	"passport_status" "passport_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "requirements" (
	"id" text PRIMARY KEY NOT NULL,
	"category_key" text NOT NULL,
	"agency" text NOT NULL,
	"title" text NOT NULL,
	"plain_english" text NOT NULL,
	"source_url" text NOT NULL,
	"severity" "severity" DEFAULT 'medium' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"effective_from" timestamp with time zone,
	"superseded_by" text
);
--> statement-breakpoint
CREATE TABLE "source_docs" (
	"id" text PRIMARY KEY NOT NULL,
	"source" text NOT NULL,
	"external_id" text NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"published_at" timestamp with time zone,
	"raw" jsonb,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "source_health" (
	"source" text PRIMARY KEY NOT NULL,
	"last_success_at" timestamp with time zone,
	"error_streak" integer DEFAULT 0 NOT NULL,
	"status" "source_status" DEFAULT 'ok' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"channel" text NOT NULL,
	"body" text NOT NULL,
	"ai_draft" text,
	"ai_confidence" real,
	"status" "ticket_status" DEFAULT 'open' NOT NULL,
	"resolved_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tariff_lines" (
	"id" text PRIMARY KEY NOT NULL,
	"hts_code" text NOT NULL,
	"base_rate" numeric,
	"s301_rate" numeric,
	"other_rates" jsonb,
	"total_rate" numeric,
	"effective_date" timestamp with time zone,
	"source_doc_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"telegram_chat_id" text,
	"plan" "plan" DEFAULT 'harbor' NOT NULL,
	"stripe_customer_id" text,
	"stripe_sub_id" text,
	"utm_first_touch" jsonb,
	"locale" text DEFAULT 'en' NOT NULL,
	"streak_weeks" integer DEFAULT 0 NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_user_id" text NOT NULL,
	"name" text NOT NULL,
	"type" "workspace_type" DEFAULT 'seller' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "affiliates" ADD CONSTRAINT "affiliates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assistant_threads" ADD CONSTRAINT "assistant_threads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "badges" ADD CONSTRAINT "badges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_source_doc_id_source_docs_id_fk" FOREIGN KEY ("source_doc_id") REFERENCES "public"."source_docs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_requirements" ADD CONSTRAINT "product_requirements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_requirements" ADD CONSTRAINT "product_requirements_requirement_id_requirements_id_fk" FOREIGN KEY ("requirement_id") REFERENCES "public"."requirements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "alerts_dedupe_idx" ON "alerts" USING btree ("event_id","user_id","product_id","channel");--> statement-breakpoint
CREATE INDEX "products_workspace_idx" ON "products" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "products_hts_idx" ON "products" USING btree ("hts_code");--> statement-breakpoint
CREATE UNIQUE INDEX "source_docs_source_external_idx" ON "source_docs" USING btree ("source","external_id");--> statement-breakpoint
CREATE INDEX "tariff_lines_hts_idx" ON "tariff_lines" USING btree ("hts_code");