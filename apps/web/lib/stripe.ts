import Stripe from "stripe";
import type { Plan } from "@lunair/core";

/**
 * Stripe is the source of truth for plan state (CLAUDE.md hard rule). Nothing in
 * the app sets users.plan except the webhook handler reacting to Stripe.
 */

let client: Stripe | null = null;

export function stripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  // No apiVersion override: the SDK pins the version it was built and typed for.
  client ??= new Stripe(key);
  return client;
}

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export type BillingInterval = "monthly" | "annual";
export type PaidPlan = Exclude<Plan, "harbor">;

/** Env var holding each price id. Prices live in Stripe, referenced by id. */
const PRICE_ENV: Record<PaidPlan, Record<BillingInterval, string>> = {
  voyage: { monthly: "STRIPE_PRICE_VOYAGE_MONTHLY", annual: "STRIPE_PRICE_VOYAGE_ANNUAL" },
  fleet: { monthly: "STRIPE_PRICE_FLEET_MONTHLY", annual: "STRIPE_PRICE_FLEET_ANNUAL" },
  lighthouse: { monthly: "STRIPE_PRICE_LIGHTHOUSE_MONTHLY", annual: "STRIPE_PRICE_LIGHTHOUSE_ANNUAL" },
};

export function priceIdFor(plan: PaidPlan, interval: BillingInterval): string | null {
  return process.env[PRICE_ENV[plan][interval]] ?? null;
}

/**
 * Reverse lookup: which plan does a Stripe price id represent?
 * Built from env at call time so a price swap needs no code change.
 */
export function planForPriceId(priceId: string, env: NodeJS.ProcessEnv = process.env): PaidPlan | null {
  for (const [plan, intervals] of Object.entries(PRICE_ENV) as Array<[PaidPlan, Record<BillingInterval, string>]>) {
    for (const varName of Object.values(intervals)) {
      if (env[varName] && env[varName] === priceId) return plan;
    }
  }
  return null;
}

/**
 * Which plan a subscription grants. A subscription that is not in good standing
 * grants nothing - we downgrade rather than keep serving paid features for free.
 */
const ENTITLING_STATUSES = new Set(["active", "trialing", "past_due"]);

export function planForSubscription(
  status: string,
  priceId: string | null | undefined,
  env: NodeJS.ProcessEnv = process.env,
): Plan {
  if (!priceId || !ENTITLING_STATUSES.has(status)) return "harbor";
  return planForPriceId(priceId, env) ?? "harbor";
}
