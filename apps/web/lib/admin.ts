"use server";

import { desc, eq, isNull, lt, sql, and, gte } from "drizzle-orm";
import { schema, AUTO_SEND_CONFIDENCE } from "@lunair/core";
import { revalidatePath } from "next/cache";
import { auth } from "./auth";
import { db } from "./db";

/**
 * The founder-facing console.
 *
 * Its reason to exist is the review queue: events below the confidence gate are
 * deliberately never auto-sent, so without somewhere to approve them they sit
 * forever and the seller is never told. That is a silent failure of the one
 * promise the product makes.
 */

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in");
  if (!session.user.isAdmin) throw new Error("Not an admin");
  return { id: session.user.id, email: session.user.email ?? session.user.id };
}

export interface PendingEvent {
  id: string;
  type: string;
  summary: string;
  confidence: number;
  affectedCategories: string[] | null;
  affectedHts: string[] | null;
  effectiveDate: Date | null;
  createdAt: Date;
  /** How many sellers would be reached if this were approved. */
  wouldReach: number;
}

/** Events held back by the confidence gate, still unreviewed and unsent. */
export async function pendingReview(limit = 50): Promise<PendingEvent[]> {
  await requireAdmin();
  const database = db();

  const rows = await database
    .select()
    .from(schema.events)
    .where(
      and(
        lt(schema.events.confidence, AUTO_SEND_CONFIDENCE),
        isNull(schema.events.reviewedBy),
        isNull(schema.events.rejectedAt),
      ),
    )
    .orderBy(desc(schema.events.createdAt))
    .limit(limit);

  if (rows.length === 0) return [];

  // Rough reach, by category overlap. Enough to tell "this hits one test account"
  // apart from "this hits everyone", which is the decision being made.
  const watchCounts = await database
    .select({ watchKey: schema.productWatches.watchKey, count: sql<number>`count(*)::int` })
    .from(schema.productWatches)
    .where(eq(schema.productWatches.enabled, true))
    .groupBy(schema.productWatches.watchKey);
  const byKey = new Map(watchCounts.map((w) => [w.watchKey, w.count]));

  return rows.map((e) => ({
    id: e.id,
    type: e.type,
    summary: e.summary,
    confidence: e.confidence,
    affectedCategories: e.affectedCategories,
    affectedHts: e.affectedHts,
    effectiveDate: e.effectiveDate,
    createdAt: e.createdAt,
    wouldReach: (e.affectedCategories ?? []).reduce((n, c) => n + (byKey.get(c) ?? 0), 0),
  }));
}

/**
 * Approve a held event so the dispatcher may send it.
 *
 * Records who approved it rather than raising the confidence score: the score is
 * what the pipeline computed and should stay honest, and `reviewed_by` is what
 * isSendable() actually checks.
 */
export async function approveEvent(eventId: string): Promise<void> {
  const admin = await requireAdmin();
  await db()
    .update(schema.events)
    .set({ reviewedBy: admin.email })
    .where(eq(schema.events.id, eventId));
  console.log(`[admin] ${admin.email} approved event ${eventId}`);
  revalidatePath("/admin");
}

/**
 * Reject: this must never be sent.
 *
 * Stamped in its own column, because isSendable() treats any reviewer as an
 * approval - an earlier version wrote "rejected:<email>" into reviewed_by and
 * thereby made rejected events sendable, which is the opposite of the intent.
 */
export async function rejectEvent(eventId: string): Promise<void> {
  const admin = await requireAdmin();
  await db()
    .update(schema.events)
    .set({ rejectedAt: new Date(), reviewedBy: admin.email })
    .where(eq(schema.events.id, eventId));
  console.log(`[admin] ${admin.email} rejected event ${eventId}`);
  revalidatePath("/admin");
}

export interface AdminOverview {
  users: number;
  paidUsers: number;
  products: number;
  activeWatches: number;
  alertsSent7d: number;
  alertsFailed: number;
  pendingReview: number;
  sources: Array<{ source: string; status: string; lastSuccessAt: Date | null; errorStreak: number }>;
  newsletter: Array<{ id: string; weekOf: Date; status: string; sentAt: Date | null }>;
}

/** The numbers that tell the founder whether the machine is actually running. */
export async function adminOverview(): Promise<AdminOverview> {
  await requireAdmin();
  const database = db();
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const one = async (q: Promise<Array<{ count: number }>>) => (await q)[0]?.count ?? 0;
  const count = sql<number>`count(*)::int`;

  const [users, paidUsers, products, activeWatches, alertsSent7d, alertsFailed, pending] = await Promise.all([
    one(database.select({ count }).from(schema.users)),
    one(database.select({ count }).from(schema.users).where(sql`${schema.users.plan} <> 'harbor'`)),
    one(database.select({ count }).from(schema.products)),
    one(database.select({ count }).from(schema.productWatches).where(eq(schema.productWatches.enabled, true))),
    one(database.select({ count }).from(schema.alerts).where(gte(schema.alerts.sentAt, weekAgo))),
    // sent_at null on an existing row means delivery failed - visible, not silent.
    one(database.select({ count }).from(schema.alerts).where(isNull(schema.alerts.sentAt))),
    one(
      database
        .select({ count })
        .from(schema.events)
        .where(
          and(
            lt(schema.events.confidence, AUTO_SEND_CONFIDENCE),
            isNull(schema.events.reviewedBy),
            isNull(schema.events.rejectedAt),
          ),
        ),
    ),
  ]);

  const sources = await database.select().from(schema.sourceHealth).orderBy(schema.sourceHealth.source);
  const newsletter = await database
    .select({
      id: schema.newsletterIssues.id,
      weekOf: schema.newsletterIssues.weekOf,
      status: schema.newsletterIssues.status,
      sentAt: schema.newsletterIssues.sentAt,
    })
    .from(schema.newsletterIssues)
    .orderBy(desc(schema.newsletterIssues.weekOf))
    .limit(5);

  return {
    users, paidUsers, products, activeWatches, alertsSent7d, alertsFailed,
    pendingReview: pending,
    sources: sources.map((s) => ({
      source: s.source, status: s.status, lastSuccessAt: s.lastSuccessAt, errorStreak: s.errorStreak,
    })),
    newsletter,
  };
}
