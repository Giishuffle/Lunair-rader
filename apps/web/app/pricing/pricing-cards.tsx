"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Plan } from "@lunair/core";

type PaidPlan = Exclude<Plan, "harbor">;
type Interval = "monthly" | "annual";

interface Tier {
  plan: Plan;
  name: string;
  tagline: string;
  monthly: number | null;
  annual: number | null;
  features: string[];
}

const TIERS: Tier[] = [
  {
    plan: "harbor",
    name: "Harbor",
    tagline: "Try it on one product",
    monthly: 0,
    annual: 0,
    features: [
      "1 Product Passport",
      "HTS suggestion & current duty snapshot",
      "Requirement list, details partially locked",
      "Weekly newsletter",
    ],
  },
  {
    plan: "voyage",
    name: "Voyage",
    tagline: "For a seller running their own catalog",
    monthly: 29,
    annual: 290,
    features: [
      "10 products",
      "Full baseline audit, nothing locked",
      "Real-time alerts by email",
      "Dollar-impact math per requirement",
      "Compliance self-checklist tracking",
    ],
  },
  {
    plan: "fleet",
    name: "Fleet",
    tagline: "For a team managing many SKUs",
    monthly: 79,
    annual: 790,
    features: [
      "50 products",
      "Everything in Voyage",
      "SKU breakeven & pricing impact",
      "3 team seats",
      "CSV export & priority data refresh",
    ],
  },
  {
    plan: "lighthouse",
    name: "Lighthouse",
    tagline: "For brokers, forwarders & sourcing agents",
    monthly: 199,
    annual: 1990,
    features: [
      "50 products, 3 team seats",
      "Everything in Fleet",
      "White-label alert feed",
      "10 client workspaces included (+$10/mo per extra)",
    ],
  },
];

const PLAN_NAME: Record<string, string> = TIERS.reduce(
  (acc, t) => ({ ...acc, [t.plan]: t.name }),
  {} as Record<string, string>,
);

export function PricingCards({
  signedIn,
  currentPlan,
  founding,
}: {
  signedIn: boolean;
  currentPlan: string | null;
  founding: boolean;
}) {
  const [interval, setInterval] = useState<Interval>("annual");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function choose(plan: PaidPlan) {
    if (!signedIn) {
      router.push("/signin?callbackUrl=/pricing");
      return;
    }
    setError(null);
    setLoadingPlan(plan);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan, interval }),
      });
      const data = (await res.json()) as { ok: boolean; url?: string; error?: string };
      if (!data.ok || !data.url) {
        setError(data.error ?? "Could not start checkout. Try again.");
        setLoadingPlan(null);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Could not reach billing. Try again in a moment.");
      setLoadingPlan(null);
    }
  }

  async function manageBilling() {
    setError(null);
    setLoadingPlan("__portal");
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = (await res.json()) as { ok: boolean; url?: string; error?: string };
      if (!data.ok || !data.url) {
        setError(data.error ?? "No billing account yet.");
        setLoadingPlan(null);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Could not reach billing. Try again in a moment.");
      setLoadingPlan(null);
    }
  }

  return (
    <div className="pricing-body">
      <div className="interval-toggle" role="group" aria-label="Billing interval">
        <button
          type="button"
          className={interval === "monthly" ? "active" : ""}
          onClick={() => setInterval("monthly")}
        >
          Monthly
        </button>
        <button
          type="button"
          className={interval === "annual" ? "active" : ""}
          onClick={() => setInterval("annual")}
        >
          Annual <span className="save-chip">2 months free</span>
        </button>
      </div>

      {error && <p className="pricing-error">{error}</p>}

      <div className="tiers">
        {TIERS.map((tier) => {
          const isCurrent = currentPlan === tier.plan;
          const price = interval === "annual" ? tier.annual : tier.monthly;
          const perMonthEquivalent =
            interval === "annual" && tier.annual ? Math.round(tier.annual / 12) : null;

          return (
            <div key={tier.plan} className={`tier${tier.plan === "voyage" ? " tier-featured" : ""}`}>
              {tier.plan === "voyage" && <span className="tier-badge">Most popular</span>}
              <p className="label">{tier.name}</p>
              <p className="tier-tagline">{tier.tagline}</p>
              <p className="tier-price">
                {price === 0 ? (
                  "Free"
                ) : (
                  <>
                    ${interval === "annual" ? perMonthEquivalent : price}
                    <span className="tier-per">/mo</span>
                  </>
                )}
              </p>
              {price !== 0 && interval === "annual" && (
                <p className="tier-billed">${price}/yr, billed annually</p>
              )}
              {tier.plan === "voyage" && founding && interval === "annual" && (
                <p className="tier-founding">Founding-50 discount applies at checkout</p>
              )}

              <ul className="tier-features">
                {tier.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>

              {tier.plan === "harbor" ? (
                isCurrent ? (
                  <span className="tier-current">Your current plan</span>
                ) : (
                  <a href={signedIn ? "/app" : "/signin?callbackUrl=/app"} className="btn-tier">
                    {signedIn ? "Go to your radar" : "Start free"}
                  </a>
                )
              ) : isCurrent ? (
                <button type="button" className="btn-tier" onClick={manageBilling} disabled={loadingPlan !== null}>
                  {loadingPlan === "__portal" ? "Opening..." : "Manage billing"}
                </button>
              ) : currentPlan && currentPlan !== "harbor" ? (
                // Already on a paid plan: route through the Portal so Stripe updates the
                // existing subscription (with proration) instead of starting a second one.
                <button type="button" className="btn-tier btn-tier-amber" onClick={manageBilling} disabled={loadingPlan !== null}>
                  {loadingPlan === "__portal" ? "Opening..." : `Switch to ${tier.name}`}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-tier btn-tier-amber"
                  onClick={() => choose(tier.plan as PaidPlan)}
                  disabled={loadingPlan !== null}
                >
                  {loadingPlan === tier.plan ? "Starting checkout..." : `Choose ${tier.name}`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {currentPlan && currentPlan !== "harbor" && (
        <p className="pricing-manage-note">
          Already on {PLAN_NAME[currentPlan] ?? currentPlan}? Use the plan card above to switch, or{" "}
          <button type="button" className="linkish" onClick={manageBilling}>
            manage billing
          </button>{" "}
          to update your card or cancel.
        </p>
      )}
    </div>
  );
}
