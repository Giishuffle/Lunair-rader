ALTER TABLE "newsletter_subscribers" ADD COLUMN "waitlist_position" integer;--> statement-breakpoint
ALTER TABLE "newsletter_subscribers" ADD CONSTRAINT "newsletter_subscribers_waitlist_position_unique" UNIQUE("waitlist_position");--> statement-breakpoint
-- Positions come from a sequence so two people signing up at the same moment
-- can never receive the same founding-member number.
CREATE SEQUENCE IF NOT EXISTS "waitlist_position_seq" AS integer START WITH 1 INCREMENT BY 1;--> statement-breakpoint
-- Backfill anyone who joined the waitlist before this column existed, oldest first.
WITH ordered AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "created_at", "id") AS rn
  FROM "newsletter_subscribers"
  WHERE "source" = 'waitlist-prelaunch' AND "waitlist_position" IS NULL
)
UPDATE "newsletter_subscribers" ns
SET "waitlist_position" = ordered.rn
FROM ordered
WHERE ns."id" = ordered."id";--> statement-breakpoint
SELECT setval('waitlist_position_seq', COALESCE((SELECT MAX("waitlist_position") FROM "newsletter_subscribers"), 0) + 1, false);