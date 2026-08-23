CREATE TYPE "public"."watch_type" AS ENUM('hts_duty', 'origin_tariff', 'agency_requirement', 'recall', 'adcvd');--> statement-breakpoint
CREATE TABLE "product_watches" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"type" "watch_type" NOT NULL,
	"watch_key" text NOT NULL,
	"label" text NOT NULL,
	"sources" jsonb,
	"confidence" real,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_watches" ADD CONSTRAINT "product_watches_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "product_watches_unique_idx" ON "product_watches" USING btree ("product_id","type","watch_key");--> statement-breakpoint
CREATE INDEX "product_watches_lookup_idx" ON "product_watches" USING btree ("type","watch_key");