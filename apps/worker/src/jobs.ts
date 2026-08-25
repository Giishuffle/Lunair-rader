import { randomUUID } from "node:crypto";
import { desc, eq, sql } from "drizzle-orm";
import { schema, type Db, type SourceAdapter, type SourceName } from "@lunair/core";
import { FederalRegisterAdapter } from "./sources/federalRegister.js";
import { UsitcHtsAdapter, diffHtsLines, type HtsLine } from "./sources/usitcHts.js";
import { CpscRecallsAdapter } from "./sources/cpscRecalls.js";
import { pingOwner } from "./notify/telegram.js";
import { checkCitedRegulations } from "./sources/ecfrWatch.js";
import { dispatchAlerts } from "./alerts/router.js";
import { draftWeeklyIssue } from "./newsletter/draft.js";
import { sendApprovedIssue } from "./newsletter/send.js";
import { processTelegramLinks } from "./notify/telegramLink.js";
import { isIsraelTime, NEWSLETTER_DRAFT_ISRAEL, NEWSLETTER_SEND_ISRAEL } from "./schedule/israelTime.js";

/** Ping the owner after this many consecutive failures of one source. */
const ERROR_STREAK_PING_THRESHOLD = 3;

async function recordSuccess(db: Db, source: SourceName) {
  await db
    .insert(schema.sourceHealth)
    .values({ source, lastSuccessAt: new Date(), errorStreak: 0, status: "ok" })
    .onConflictDoUpdate({
      target: schema.sourceHealth.source,
      set: { lastSuccessAt: new Date(), errorStreak: 0, status: "ok" },
    });
}

async function recordFailure(db: Db, source: SourceName, err: unknown) {
  const [row] = await db
    .insert(schema.sourceHealth)
    .values({ source, errorStreak: 1, status: "degraded" })
    .onConflictDoUpdate({
      target: schema.sourceHealth.source,
      set: { errorStreak: sql`${schema.sourceHealth.errorStreak} + 1`, status: "degraded" },
    })
    .returning({ errorStreak: schema.sourceHealth.errorStreak });

  // Watchdog: ping the owner on the threshold failure only, not every retry.
  if (row && row.errorStreak === ERROR_STREAK_PING_THRESHOLD) {
    const message = err instanceof Error ? err.message : String(err);
    await pingOwner(
      `⚠️ <b>Source degraded:</b> ${source}\n${row.errorStreak} consecutive failures.\n<code>${message.slice(0, 300)}</code>\n\nAlerts depending on this source are paused until it recovers.`,
    ).catch((e) => console.error("[watchdog] owner ping failed", e));
  }
}

/** Fetch via adapter, upsert into source_docs, maintain source_health. Returns inserted count. */
async function ingest(db: Db, adapter: SourceAdapter, since: Date | null): Promise<number> {
  try {
    const docs = await adapter.fetchSince(since);
    let inserted = 0;
    for (const d of docs) {
      const res = await db
        .insert(schema.sourceDocs)
        .values({
          id: randomUUID(),
          source: d.source,
          externalId: d.externalId,
          title: d.title,
          url: d.url,
          publishedAt: d.publishedAt,
          raw: d.raw,
        })
        .onConflictDoNothing()
        .returning({ id: schema.sourceDocs.id });
      inserted += res.length;
    }
    await recordSuccess(db, adapter.source);
    console.log(`[${adapter.source}] ${docs.length} fetched, ${inserted} new`);
    return inserted;
  } catch (err) {
    await recordFailure(db, adapter.source, err);
    throw err;
  }
}

/** Daily ops digest to the owner's Telegram: source health at a glance. */
async function opsHealthDigest(db: Db): Promise<void> {
  const rows = await db.select().from(schema.sourceHealth).orderBy(schema.sourceHealth.source);
  const [{ count: docCount } = { count: 0 }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.sourceDocs);

  const lines = rows.map((r) => {
    const icon = r.status === "ok" ? "🟢" : r.status === "degraded" ? "🟠" : "🔴";
    const last = r.lastSuccessAt ? `${Math.round((Date.now() - r.lastSuccessAt.getTime()) / 3.6e6)}h ago` : "never";
    return `${icon} <b>${r.source}</b> - last ok ${last}${r.errorStreak > 0 ? ` (${r.errorStreak} errors)` : ""}`;
  });

  const allOk = rows.length > 0 && rows.every((r) => r.status === "ok");
  const header = allOk ? "🌙 <b>Lunair watchers: all clear</b>" : "🌙 <b>Lunair watchers: attention needed</b>";
  await pingOwner(`${header}\n\n${lines.join("\n")}\n\n${docCount} source documents on the radar.`);
}

/**
 * Compare the two most recent HTS snapshots per range; log rate changes.
 * Phase 2 turns detected changes into `events` via the AI pipeline; until then
 * this proves the diff engine against live data.
 */
async function diffLatestHtsSnapshots(db: Db): Promise<void> {
  const snapshots = await db
    .select()
    .from(schema.sourceDocs)
    .where(eq(schema.sourceDocs.source, "usitc_hts"))
    .orderBy(desc(schema.sourceDocs.publishedAt), desc(schema.sourceDocs.externalId));

  const byRange = new Map<string, typeof snapshots>();
  for (const s of snapshots) {
    const range = s.externalId.split(":")[0] ?? "";
    const list = byRange.get(range) ?? [];
    list.push(s);
    byRange.set(range, list);
  }
  for (const [range, list] of byRange) {
    if (list.length < 2) continue;
    const [next, prev] = list as [typeof snapshots[number], typeof snapshots[number]];
    const nextLines = (next.raw as { lines: HtsLine[] }).lines;
    const prevLines = (prev.raw as { lines: HtsLine[] }).lines;
    const changes = diffHtsLines(prevLines, nextLines);
    if (changes.length > 0) {
      console.log(`[usitc_hts] range ${range}: ${changes.length} rate changes detected`);
      for (const c of changes.slice(0, 20)) console.log(`  ${c.kind} ${c.htsno}`);
    }
  }
}

export type JobName =
  | "federal_register:poll"
  | "usitc_hts:diff"
  | "cpsc_recalls:poll"
  | "ecfr:check"
  | "alerts:dispatch"
  | "newsletter:draft"
  | "newsletter:send"
  | "telegram:link"
  | "ops:health-digest";

/**
 * Cron is UTC. Israel is UTC+3 (IDT, summer) / UTC+2 (IST, winter) - times that
 * matter to the founder are noted in Israel time beside each entry.
 */
export const JOB_SCHEDULES: Record<JobName, string> = {
  "federal_register:poll": "0 * * * *", // hourly
  "usitc_hts:diff": "30 6 * * *", // daily
  "cpsc_recalls:poll": "15 */6 * * *", // every 6h
  // The CFR moves slowly; daily is plenty and keeps us polite.
  "ecfr:check": "45 5 * * *",
  // Every 15 minutes: the promise is "we ping you the moment anything moves",
  // and the latency KPI is under six hours.
  "alerts:dispatch": "*/15 * * * *",
  // Both newsletter jobs run hourly and gate on real Israel local time inside the
  // handler, so the Sun 09:00 / Mon 11:00 promise survives DST (israelTime.ts).
  "newsletter:draft": "5 * * * *",
  "newsletter:send": "10 * * * *",
  // Someone linking their account is waiting on this, so keep it brisk.
  "telegram:link": "*/2 * * * *",
  "ops:health-digest": "0 6 * * *", // daily 09:00 Israel
};

export function jobHandlers(db: Db): Record<JobName, () => Promise<void>> {
  return {
    "federal_register:poll": async () => {
      await ingest(db, new FederalRegisterAdapter(), new Date(Date.now() - 3 * 24 * 3600 * 1000));
    },
    "usitc_hts:diff": async () => {
      await ingest(db, new UsitcHtsAdapter(), null);
      await diffLatestHtsSnapshots(db);
    },
    "cpsc_recalls:poll": async () => {
      await ingest(db, new CpscRecallsAdapter(), new Date(Date.now() - 30 * 24 * 3600 * 1000));
    },
    "ecfr:check": async () => {
      const { checked, changed } = await checkCitedRegulations(db);
      await recordSuccess(db, "ecfr");
      if (changed > 0) {
        await pingOwner(
          `📜 <b>${changed} cited regulation${changed === 1 ? "" : "s"} amended</b>\n` +
            `Checked ${checked} CFR parts behind the rule library. Review the wording of the affected requirements.`,
        ).catch(() => undefined);
      }
    },
    "alerts:dispatch": async () => {
      const r = await dispatchAlerts(db);
      if (r.alertsSent > 0) {
        await pingOwner(
          `📡 <b>${r.alertsSent} alert${r.alertsSent === 1 ? "" : "s"} sent</b>\n` +
            `From ${r.eventsConsidered} new event${r.eventsConsidered === 1 ? "" : "s"}.` +
            (r.skippedFreeTier > 0 ? `\n${r.skippedFreeTier} free-tier match${r.skippedFreeTier === 1 ? "" : "es"} withheld - upgrade prompts.` : ""),
        ).catch(() => undefined);
      }
    },
    "newsletter:draft": async () => {
      if (!isIsraelTime(new Date(), NEWSLETTER_DRAFT_ISRAEL.weekday, NEWSLETTER_DRAFT_ISRAEL.hour)) return;
      const r = await draftWeeklyIssue(db);
      console.log(`[newsletter:draft] ${r.status}${r.itemCount ? ` (${r.itemCount} items)` : ""}`);
    },
    "newsletter:send": async () => {
      if (!isIsraelTime(new Date(), NEWSLETTER_SEND_ISRAEL.weekday, NEWSLETTER_SEND_ISRAEL.hour)) return;
      const r = await sendApprovedIssue(db);
      if (r.status === "sent") {
        await pingOwner(
          `📬 <b>Lunar Tide sent</b>\n${r.sent} delivered${r.failed ? `, ${r.failed} failed` : ""}.`,
        ).catch(() => undefined);
      } else if (r.status === "nothing-approved") {
        await pingOwner(
          `📭 <b>Lunar Tide not sent</b>\nNo issue was approved in time, so nothing went out. Nothing is broken - approve this week's draft and it goes next Monday.`,
        ).catch(() => undefined);
      }
    },
    "telegram:link": async () => {
      const r = await processTelegramLinks(db);
      if (r.linked > 0) console.log(`[telegram:link] ${r.linked} account(s) connected`);
    },
    "ops:health-digest": async () => {
      await opsHealthDigest(db);
    },
  };
}
