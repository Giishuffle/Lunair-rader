import { randomUUID } from "node:crypto";
import { and, desc, gte, eq } from "drizzle-orm";
import {
  schema,
  parseNewsletterDraft,
  renderIssueMarkdown,
  findUnhedgedBannedCopy,
  approveToken,
  type Db,
  type NewsletterDraft,
} from "@lunair/core";
import { anthropic } from "../ai/anthropic.js";
import { pingOwner } from "../notify/telegram.js";

const MODEL = "claude-sonnet-5";
const MAX_ITEMS = 5;

export type Complete = (prompt: string) => Promise<string | null>;

async function defaultComplete(prompt: string): Promise<string | null> {
  const res = await anthropic().messages.create({
    model: MODEL,
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });
  const block = res.content.find((b) => b.type === "text");
  return block && "text" in block ? block.text.trim() : null;
}

/** Monday of the week containing `now`, at UTC midnight - the issue's stable identity. */
export function weekOf(now: Date): Date {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dayOffset = (d.getUTCDay() + 6) % 7; // Monday = 0
  d.setUTCDate(d.getUTCDate() - dayOffset);
  return d;
}

export interface DraftResult {
  status: "drafted" | "no-material" | "already-exists" | "ai-unavailable";
  issueId?: string;
  itemCount?: number;
}

/**
 * Draft this week's issue from the events the watchers actually found, and ask
 * the owner to approve it. Never sends - that is a separate job, and it only
 * ever sends an issue a human approved.
 */
export async function draftWeeklyIssue(
  db: Db,
  now: Date = new Date(),
  complete: Complete = defaultComplete,
): Promise<DraftResult> {
  const week = weekOf(now);

  const [existing] = await db
    .select({ id: schema.newsletterIssues.id, status: schema.newsletterIssues.status })
    .from(schema.newsletterIssues)
    .where(eq(schema.newsletterIssues.weekOf, week))
    .limit(1);
  if (existing) return { status: "already-exists", issueId: existing.id };

  const since = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  const events = await db
    .select({
      type: schema.events.type,
      summary: schema.events.summary,
      effectiveDate: schema.events.effectiveDate,
      affectedCategories: schema.events.affectedCategories,
      sourceUrl: schema.sourceDocs.url,
      sourceTitle: schema.sourceDocs.title,
    })
    .from(schema.events)
    .leftJoin(schema.sourceDocs, eq(schema.sourceDocs.id, schema.events.sourceDocId))
    .where(gte(schema.events.createdAt, since))
    .orderBy(desc(schema.events.confidence))
    .limit(MAX_ITEMS * 3);

  if (events.length === 0) {
    console.log("[newsletter] no events this week, nothing to draft");
    return { status: "no-material" };
  }

  const text = await complete(buildPrompt(events, week));
  if (!text) return { status: "ai-unavailable" };

  const draft = parseNewsletterDraft(text);
  if (!draft) {
    console.error("[newsletter] could not parse model output as a draft");
    return { status: "ai-unavailable" };
  }

  const flagged = bannedCopyIn(draft);
  if (flagged) {
    console.error(`[newsletter] rejected draft, unhedged "${flagged}"`);
    return { status: "ai-unavailable" };
  }

  // Every link must be one we gave the model. A newsletter that cites a
  // plausible-looking URL the model invented is worse than no newsletter.
  const allowedUrls = new Set(events.map((e) => e.sourceUrl).filter((u): u is string => Boolean(u)));
  const invented = draft.items.filter((i) => !allowedUrls.has(i.sourceUrl));
  if (invented.length > 0) {
    console.error(`[newsletter] rejected draft, ${invented.length} source URL(s) not in the material`);
    return { status: "ai-unavailable" };
  }

  const id = randomUUID();
  await db.insert(schema.newsletterIssues).values({
    id,
    weekOf: week,
    // Human-readable copy for approval; `stats.draft` is what actually gets sent.
    draftMd: renderIssueMarkdown(draft),
    // Rendered at send time, when the per-recipient unsubscribe link is known.
    html: null,
    status: "drafted",
    stats: { itemCount: draft.items.length, subject: draft.subject, draft },
  });

  await notifyOwnerForApproval(id, draft, week).catch((e) =>
    console.error("[newsletter] owner approval ping failed", e),
  );

  console.log(`[newsletter] drafted issue ${id} for week of ${week.toISOString().slice(0, 10)}`);
  return { status: "drafted", issueId: id, itemCount: draft.items.length };
}

function bannedCopyIn(draft: NewsletterDraft): string | null {
  const parts = [draft.subject, draft.intro, ...draft.items.flatMap((i) => [i.headline, i.body])];
  for (const part of parts) {
    const hit = findUnhedgedBannedCopy(part);
    if (hit) return hit.phrase;
  }
  return null;
}

async function notifyOwnerForApproval(issueId: string, draft: NewsletterDraft, week: Date): Promise<void> {
  const secret = process.env.AUTH_SECRET;
  const appUrl = process.env.APP_URL ?? "https://www.lunair-world.com";
  const approveUrl = secret
    ? `${appUrl}/api/newsletter/approve?issue=${issueId}&token=${approveToken(issueId, secret)}`
    : null;

  const headlines = draft.items.map((i) => `- ${i.headline}`).join("\n");
  await pingOwner(
    `📰 <b>Lunar Tide draft ready</b>\nWeek of ${week.toISOString().slice(0, 10)} - ${draft.items.length} item${draft.items.length === 1 ? "" : "s"}\n\n` +
      `<b>${draft.subject}</b>\n${headlines}\n\n` +
      (approveUrl
        ? `<a href="${approveUrl}">Approve and schedule for Monday</a>\nNothing sends until you click this.`
        : `AUTH_SECRET is not set, so no approval link could be signed. Approve in the database.`),
  );
}

type EventRow = {
  type: string;
  summary: string;
  effectiveDate: Date | null;
  affectedCategories: string[] | null;
  sourceUrl: string | null;
  sourceTitle: string | null;
};

function buildPrompt(events: EventRow[], week: Date): string {
  const material = events
    .map((e, i) => {
      const when = e.effectiveDate ? e.effectiveDate.toISOString().slice(0, 10) : "no stated date";
      return `[${i + 1}] type=${e.type} effective=${when} categories=${(e.affectedCategories ?? []).join(",") || "none"}
source_title=${e.sourceTitle ?? "unknown"}
source_url=${e.sourceUrl ?? "none"}
text: ${e.summary}`;
    })
    .join("\n\n");

  return `You write "the Lunar Tide", the weekly newsletter from Lunair World - a US
import-compliance monitoring service for small e-commerce sellers. Readers import
physical goods, mostly from China/Vietnam/India, and are not customs professionals.

Below is everything our government-source watchers found in the week of ${week
    .toISOString()
    .slice(0, 10)}. Turn it into an issue.

Rules, no exceptions:
- Pick the ${MAX_ITEMS} most consequential items at most. Fewer is fine. Skip anything
  that would not change what a small importer does or pays.
- Each item: a concrete headline, then 2-3 sentences in plain English. Explain any
  jargon you cannot avoid.
- Hedge applicability - "appears to", "may affect", "if you import X". You do not know
  any individual reader's products.
- Never use the words "guaranteed", "certified", "legal advice", or the phrase "we ensure
  compliance", even in a negation.
- Invent nothing. Every item must trace to the material below, and you must copy its
  source_url exactly as given. Never write a URL that does not appear below.
- If an item has source_url=none, leave that item out entirely.
- The intro is 1-2 sentences setting up the week. No greeting, no signature.

Material:
${material}

Respond with ONLY a JSON object, no markdown fences:
{"subject": "...", "intro": "...", "items": [{"headline": "...", "body": "...", "sourceTitle": "...", "sourceUrl": "..."}]}`;
}
