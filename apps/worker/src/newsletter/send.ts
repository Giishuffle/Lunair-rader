import { and, eq, isNull } from "drizzle-orm";
import {
  schema,
  renderIssueHtml,
  renderIssueText,
  unsubscribeToken,
  type Db,
  type NewsletterDraft,
} from "@lunair/core";
import { sendEmail } from "../notify/email.js";

const APP_URL = process.env.APP_URL ?? "https://www.lunair-world.com";

export interface SendResult {
  status: "sent" | "nothing-approved" | "no-subscribers";
  issueId?: string;
  sent?: number;
  failed?: number;
}

/**
 * Send the approved issue for this week to confirmed, still-subscribed readers.
 *
 * Only ever sends status="approved". An unapproved draft is left alone, so a
 * week the owner never got to simply does not go out - silence beats sending
 * unreviewed AI copy to the whole list.
 */
export async function sendApprovedIssue(db: Db): Promise<SendResult> {
  const [issue] = await db
    .select({ id: schema.newsletterIssues.id, stats: schema.newsletterIssues.stats })
    .from(schema.newsletterIssues)
    .where(and(eq(schema.newsletterIssues.status, "approved"), isNull(schema.newsletterIssues.sentAt)))
    .limit(1);

  if (!issue) return { status: "nothing-approved" };

  const draft = (issue.stats as { draft?: NewsletterDraft } | null)?.draft;
  if (!draft?.subject || !draft.items?.length) {
    console.error(`[newsletter] issue ${issue.id} is approved but carries no usable draft`);
    return { status: "nothing-approved" };
  }

  const subscribers = await db
    .select({ email: schema.newsletterSubscribers.email })
    .from(schema.newsletterSubscribers)
    .where(isNull(schema.newsletterSubscribers.unsubscribedAt));

  if (subscribers.length === 0) return { status: "no-subscribers", issueId: issue.id };

  const secret = process.env.AUTH_SECRET;
  let sent = 0;
  let failed = 0;

  for (const sub of subscribers) {
    // No secret means no verifiable unsubscribe link, and a bulk email without a
    // working unsubscribe is one we must not send (CAN-SPAM).
    if (!secret) {
      console.error("[newsletter] AUTH_SECRET is not set - refusing to send without unsubscribe links");
      break;
    }
    const unsubscribeUrl = `${APP_URL}/unsubscribe?email=${encodeURIComponent(sub.email)}&token=${unsubscribeToken(sub.email, secret)}`;
    const opts = { unsubscribeUrl, appUrl: APP_URL };
    try {
      await sendEmail({
        to: sub.email,
        subject: draft.subject,
        html: renderIssueHtml(draft, opts),
        text: renderIssueText(draft, opts),
      });
      sent += 1;
    } catch (err) {
      failed += 1;
      console.error(`[newsletter] delivery failed for ${sub.email}`, err);
    }
  }

  await db
    .update(schema.newsletterIssues)
    .set({ status: "sent", sentAt: new Date(), stats: { ...(issue.stats as object), sent, failed } })
    .where(eq(schema.newsletterIssues.id, issue.id));

  console.log(`[newsletter] issue ${issue.id}: ${sent} sent, ${failed} failed`);
  return { status: "sent", issueId: issue.id, sent, failed };
}

