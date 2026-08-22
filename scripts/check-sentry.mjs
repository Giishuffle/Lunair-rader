/**
 * Sends one test error to Sentry and confirms it was accepted.
 * Usage: node --env-file=.env.local scripts/check-sentry.mjs
 *
 * Look for it under Issues in the Sentry project. Safe to run any time;
 * the event is tagged so it's obvious it was deliberate.
 */
import * as Sentry from "@sentry/node";

const dsn = process.env.SENTRY_DSN;
if (!dsn) {
  console.error("SENTRY_DSN not set in .env.local");
  process.exit(1);
}

Sentry.init({ dsn, environment: "verification", sendDefaultPii: false, tracesSampleRate: 0 });

const eventId = Sentry.captureException(
  new Error("Lunair setup verification - if you can read this in Sentry, error reporting works"),
  { tags: { deliberate: "true", source: "check-sentry-script" } },
);

const delivered = await Sentry.flush(5000);
console.log(delivered ? `Sent. Event id ${eventId}` : "Flush timed out - check the DSN and network.");
console.log("Open Sentry -> Issues to confirm it arrived.");
process.exit(delivered ? 0 : 1);
