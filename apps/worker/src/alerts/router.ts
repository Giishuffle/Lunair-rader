import { randomUUID } from "node:crypto";
import { and, eq, inArray, isNull, or } from "drizzle-orm";
import {
  schema,
  matchWatches,
  isSendable,
  PLAN_LIMITS,
  type Db,
  type EventLike,
  type WatchLike,
  type Plan,
} from "@lunair/core";
import { alertEmail } from "./email.js";
import { sendEmail } from "../notify/email.js";

/**
 * Events -> the sellers who asked to hear about them.
 *
 * Order of gates, each of which exists for a reason:
 *   1. confidence   - low-confidence events wait for review, never auto-send
 *   2. match        - only watches the seller actually switched on
 *   3. tier         - the free plan does not get real-time alerts
 *   4. dedupe       - a unique index on (event, user, product, channel) means a
 *                     rerun can never double-send, even if this code is wrong
 *   5. delivery     - and only then does anyone's inbox get touched
 */

const APP_URL = process.env.APP_URL ?? "https://www.lunair-world.com";

interface Recipient {
  watch: WatchLike & { label: string; sources: Array<{ title: string; url: string }> | null };
  productId: string;
  productName: string;
  userId: string;
  userEmail: string;
  plan: Plan;
}

export interface DispatchResult {
  eventsConsidered: number;
  alertsCreated: number;
  alertsSent: number;
  skippedFreeTier: number;
}

/**
 * Dispatch alerts for events that have not been routed yet.
 * An event is "routed" once any alert row references it; unrouted events are
 * found by left-joining, so a crash mid-run simply resumes next time.
 */
export async function dispatchAlerts(db: Db, limit = 50): Promise<DispatchResult> {
  const result: DispatchResult = { eventsConsidered: 0, alertsCreated: 0, alertsSent: 0, skippedFreeTier: 0 };

  const pending = await db
    .select({
      id: schema.events.id,
      type: schema.events.type,
      summary: schema.events.summary,
      affectedHts: schema.events.affectedHts,
      affectedCategories: schema.events.affectedCategories,
      confidence: schema.events.confidence,
      reviewedBy: schema.events.reviewedBy,
      effectiveDate: schema.events.effectiveDate,
    })
    .from(schema.events)
    .leftJoin(schema.alerts, eq(schema.alerts.eventId, schema.events.id))
    .where(isNull(schema.alerts.id))
    .limit(limit);

  if (pending.length === 0) return result;

  for (const event of pending) {
    result.eventsConsidered += 1;
    if (!isSendable(event as EventLike)) {
      console.log(`[alerts] event ${event.id} held: confidence ${event.confidence} below gate, no reviewer`);
      continue;
    }

    const recipients = await findRecipients(db, event as EventLike);
    for (const r of recipients) {
      if (!PLAN_LIMITS[r.plan].realtimeAlerts) {
        result.skippedFreeTier += 1;
        continue;
      }

      // The unique index is the real guard; onConflictDoNothing makes a rerun safe.
      const [created] = await db
        .insert(schema.alerts)
        .values({
          id: randomUUID(),
          eventId: event.id,
          userId: r.userId,
          productId: r.productId,
          channel: "email",
        })
        .onConflictDoNothing()
        .returning({ id: schema.alerts.id });

      if (!created) continue; // already alerted on this event for this product
      result.alertsCreated += 1;

      const mail = alertEmail({
        productName: r.productName,
        eventSummary: event.summary,
        watchLabel: r.watch.label,
        effectiveDate: event.effectiveDate,
        sources: r.watch.sources ?? [],
        appUrl: APP_URL,
        productId: r.productId,
      });

      try {
        await sendEmail({ to: r.userEmail, ...mail });
        await db.update(schema.alerts).set({ sentAt: new Date() }).where(eq(schema.alerts.id, created.id));
        result.alertsSent += 1;
      } catch (err) {
        // Leave sentAt null. The row exists so we do not re-alert, but the null
        // is a visible record that delivery failed rather than a silent loss.
        console.error(`[alerts] delivery failed for alert ${created.id}`, err);
      }
    }
  }

  console.log(
    `[alerts] ${result.eventsConsidered} events, ${result.alertsCreated} alerts created, ` +
      `${result.alertsSent} sent, ${result.skippedFreeTier} skipped (free tier)`,
  );
  return result;
}

/** Everyone watching something this event touches. */
async function findRecipients(db: Db, event: EventLike): Promise<Recipient[]> {
  // Pull candidate watches by type first so matching runs over a small set.
  const rows = await db
    .select({
      watchId: schema.productWatches.id,
      watchType: schema.productWatches.type,
      watchKey: schema.productWatches.watchKey,
      watchLabel: schema.productWatches.label,
      watchSources: schema.productWatches.sources,
      enabled: schema.productWatches.enabled,
      productId: schema.products.id,
      productName: schema.products.name,
      userId: schema.users.id,
      userEmail: schema.users.email,
      plan: schema.users.plan,
    })
    .from(schema.productWatches)
    .innerJoin(schema.products, eq(schema.products.id, schema.productWatches.productId))
    .innerJoin(schema.workspaces, eq(schema.workspaces.id, schema.products.workspaceId))
    .innerJoin(schema.users, eq(schema.users.id, schema.workspaces.ownerUserId))
    .where(eq(schema.productWatches.enabled, true));

  const asWatches: WatchLike[] = rows.map((r) => ({
    id: r.watchId,
    productId: r.productId,
    type: r.watchType,
    watchKey: r.watchKey,
    enabled: r.enabled,
  }));

  const matchedIds = new Set(matchWatches(event, asWatches).map((w) => w.id));

  return rows
    .filter((r) => matchedIds.has(r.watchId))
    .map((r) => ({
      watch: {
        id: r.watchId,
        productId: r.productId,
        type: r.watchType,
        watchKey: r.watchKey,
        enabled: r.enabled,
        label: r.watchLabel,
        sources: r.watchSources,
      },
      productId: r.productId,
      productName: r.productName,
      userId: r.userId,
      userEmail: r.userEmail,
      plan: r.plan,
    }));
}
