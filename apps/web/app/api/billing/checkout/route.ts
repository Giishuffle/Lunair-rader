import { NextResponse } from "next/server";
import { eq, and, isNotNull, lte } from "drizzle-orm";
import { schema, FOUNDING_SPOTS, FOUNDING_PROMO_CODE, isFoundingMember } from "@lunair/core";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe, stripeConfigured, priceIdFor, type BillingInterval, type PaidPlan } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAID_PLANS = new Set<PaidPlan>(["voyage", "fleet", "lighthouse"]);

/**
 * Start a Stripe Checkout session for the signed-in user.
 *
 * Auto-renewal disclosure lives on the checkout page and in the confirmation
 * email (ToS §5). Founding-50 members get their discount applied automatically
 * on annual plans - they should never have to remember a code.
 */
export async function POST(req: Request) {
  if (!stripeConfigured()) {
    return NextResponse.json({ ok: false, error: "billing not configured" }, { status: 503 });
  }

  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ ok: false, error: "sign in first" }, { status: 401 });
  }

  let body: { plan?: string; interval?: string };
  try {
    body = (await req.json()) as { plan?: string; interval?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "invalid request" }, { status: 400 });
  }

  const plan = body.plan as PaidPlan;
  const interval = (body.interval ?? "monthly") as BillingInterval;
  if (!PAID_PLANS.has(plan) || (interval !== "monthly" && interval !== "annual")) {
    return NextResponse.json({ ok: false, error: "unknown plan" }, { status: 400 });
  }

  const priceId = priceIdFor(plan, interval);
  if (!priceId) {
    return NextResponse.json({ ok: false, error: "price not configured" }, { status: 503 });
  }

  const database = db();
  const [user] = await database
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, session.user.id))
    .limit(1);
  if (!user) return NextResponse.json({ ok: false, error: "no such user" }, { status: 401 });

  // Reuse the Stripe customer so a returning subscriber keeps one billing history.
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe().customers.create({
      email: user.email,
      name: user.name ?? undefined,
      metadata: { lunairUserId: user.id },
    });
    customerId = customer.id;
    await database
      .update(schema.users)
      .set({ stripeCustomerId: customerId })
      .where(eq(schema.users.id, user.id));
  }

  // Founding-50: annual only, and only for someone actually in the first 50.
  const [waitlisted] = await database
    .select({ position: schema.newsletterSubscribers.waitlistPosition })
    .from(schema.newsletterSubscribers)
    .where(
      and(
        eq(schema.newsletterSubscribers.email, user.email.toLowerCase()),
        isNotNull(schema.newsletterSubscribers.waitlistPosition),
        lte(schema.newsletterSubscribers.waitlistPosition, FOUNDING_SPOTS),
      ),
    )
    .limit(1);
  const founding = interval === "annual" && isFoundingMember(waitlisted?.position);

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";

  const checkout = await stripe().checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    // Stripe Tax works out US sales tax where SaaS is taxable.
    automatic_tax: { enabled: true },
    customer_update: { address: "auto", name: "auto" },
    // Anyone can still type a code; founding members get theirs applied for them.
    ...(founding
      ? { discounts: [{ promotion_code: await foundingPromotionCodeId() }] }
      : { allow_promotion_codes: true }),
    success_url: `${appUrl}/app?welcome=1`,
    cancel_url: `${appUrl}/pricing`,
    subscription_data: { metadata: { lunairUserId: user.id, plan, interval } },
    metadata: { lunairUserId: user.id, plan, interval },
  });

  return NextResponse.json({ ok: true, url: checkout.url });
}

/** Resolve FOUNDING50 to its promotion-code id, which is what Checkout wants. */
async function foundingPromotionCodeId(): Promise<string> {
  const found = await stripe().promotionCodes.list({ code: FOUNDING_PROMO_CODE, active: true, limit: 1 });
  const id = found.data[0]?.id;
  if (!id) throw new Error(`promotion code ${FOUNDING_PROMO_CODE} not found in Stripe`);
  return id;
}
