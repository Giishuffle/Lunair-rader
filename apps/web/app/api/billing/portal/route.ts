import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { schema } from "@lunair/core";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe, stripeConfigured } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stripe's Customer Portal: change plan, update card, view invoices, and cancel.
 * Cancellation must stay one self-serve click (ToS §5, auto-renewal statutes).
 */
export async function POST() {
  if (!stripeConfigured()) {
    return NextResponse.json({ ok: false, error: "billing not configured" }, { status: 503 });
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "sign in first" }, { status: 401 });
  }

  const [user] = await db()
    .select({ customerId: schema.users.stripeCustomerId })
    .from(schema.users)
    .where(eq(schema.users.id, session.user.id))
    .limit(1);

  if (!user?.customerId) {
    return NextResponse.json({ ok: false, error: "no billing account yet" }, { status: 400 });
  }

  const portal = await stripe().billingPortal.sessions.create({
    customer: user.customerId,
    return_url: `${process.env.APP_URL ?? "http://localhost:3000"}/app/settings`,
  });

  return NextResponse.json({ ok: true, url: portal.url });
}
