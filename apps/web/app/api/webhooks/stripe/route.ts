import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { eq } from "drizzle-orm";
import { schema } from "@lunair/core";
import { db } from "@/lib/db";
import { stripe, stripeConfigured, planForSubscription } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stripe -> users.plan. This is the ONLY place plan state is written; nothing
 * else in the app may promote or demote an account (CLAUDE.md hard rule).
 *
 * Signature verification is mandatory: without it anyone who finds this URL
 * could grant themselves a paid plan by posting JSON.
 */
export async function POST(req: Request) {
  if (!stripeConfigured()) {
    return NextResponse.json({ ok: false, error: "billing not configured" }, { status: 503 });
  }
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET is not set - refusing unverified events");
    return NextResponse.json({ ok: false, error: "webhook not configured" }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ ok: false, error: "missing signature" }, { status: 400 });

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe().webhooks.constructEventAsync(raw, signature, secret);
  } catch (err) {
    console.error("[stripe-webhook] signature verification failed", err);
    return NextResponse.json({ ok: false, error: "bad signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncSubscription(event.data.object);
        break;
      case "checkout.session.completed": {
        const s = event.data.object;
        if (s.mode === "subscription" && typeof s.subscription === "string") {
          await syncSubscription(await stripe().subscriptions.retrieve(s.subscription));
        }
        break;
      }
      default:
        // Everything else is acknowledged and ignored; Stripe retries on non-2xx.
        break;
    }
  } catch (err) {
    console.error(`[stripe-webhook] handling ${event.type} failed`, err);
    // 500 so Stripe retries rather than dropping a plan change on the floor.
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function syncSubscription(sub: Stripe.Subscription): Promise<void> {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const item = sub.items.data[0];
  const priceId = item?.price?.id ?? null;

  // A deleted subscription entitles nothing regardless of its last status.
  const status = sub.status === "canceled" ? "canceled" : sub.status;
  const plan = planForSubscription(status, priceId);

  const renewsAt = item?.current_period_end ? new Date(item.current_period_end * 1000) : null;

  const result = await db()
    .update(schema.users)
    .set({
      plan,
      stripeSubId: sub.id,
      stripeStatus: status,
      planRenewsAt: renewsAt,
      cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
    })
    .where(eq(schema.users.stripeCustomerId, customerId))
    .returning({ id: schema.users.id });

  if (result.length === 0) {
    // Worth shouting about: a paying customer we cannot match to an account.
    console.error(`[stripe-webhook] no user for stripe customer ${customerId}`);
    throw new Error(`unmatched stripe customer ${customerId}`);
  }
  console.log(`[stripe-webhook] ${result[0]!.id} -> plan=${plan} status=${status}`);
}
