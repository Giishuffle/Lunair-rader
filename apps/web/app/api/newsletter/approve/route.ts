import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { schema, verifyApproveToken } from "@lunair/core";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The owner's one-click newsletter approval, reached from the Telegram draft ping.
 *
 * Signed rather than session-gated so it works from a phone without signing in,
 * and it only ever moves an issue drafted -> approved. The send job picks it up
 * from there; this route sends nothing itself.
 */
export async function GET(req: Request) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return text("Approval is not configured on this deployment.", 503);

  const url = new URL(req.url);
  const issueId = url.searchParams.get("issue");
  const token = url.searchParams.get("token");
  if (!issueId || !token) return text("This approval link is incomplete.", 400);
  if (!verifyApproveToken(issueId, token, secret)) return text("This approval link is not valid.", 403);

  const [issue] = await db()
    .select({ id: schema.newsletterIssues.id, status: schema.newsletterIssues.status })
    .from(schema.newsletterIssues)
    .where(eq(schema.newsletterIssues.id, issueId))
    .limit(1);

  if (!issue) return text("That issue no longer exists.", 404);
  if (issue.status === "sent") return text("That issue has already gone out.");
  if (issue.status === "approved") return text("Already approved. It goes out Monday 11:00 Israel time.");

  await db()
    .update(schema.newsletterIssues)
    .set({ status: "approved", approvedAt: new Date() })
    .where(eq(schema.newsletterIssues.id, issueId));

  return text("Approved. This issue goes out Monday 11:00 Israel time.");
}

function text(body: string, status = 200) {
  return new NextResponse(body, { status, headers: { "content-type": "text/plain; charset=utf-8" } });
}
